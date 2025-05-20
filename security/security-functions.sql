-- Create helper functions to check RLS status

-- Function to check if RLS is enabled for a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE oid = (table_name::regclass)::oid;
  
  RETURN rls_enabled;
END;
$$;

-- Function to get all policies for a table
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
  policyname text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.policyname,
    p.roles,
    p.cmd,
    p.qual::text,
    p.with_check::text
  FROM
    pg_policies p
  WHERE
    p.tablename = table_name
    AND p.schemaname = 'public';
END;
$$;

-- Function to get all tables in the public schema
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public';
END;
$$;

-- Function to enable RLS on a table
CREATE OR REPLACE FUNCTION enable_rls_on_table(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error enabling RLS on %: %', table_name, SQLERRM;
    RETURN false;
END;
$$;

-- Function to create a policy
CREATE OR REPLACE FUNCTION create_policy(
  table_name text,
  policy_name text,
  operation text,
  using_expression text DEFAULT NULL,
  check_expression text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Check if policy already exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  ) THEN
    -- Drop existing policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
  END IF;
  
  -- Build SQL statement based on provided parameters
  sql_statement := format('CREATE POLICY %I ON %I FOR %s', 
                         policy_name, table_name, operation);
  
  -- Add USING clause if provided
  IF using_expression IS NOT NULL THEN
    sql_statement := sql_statement || format(' USING (%s)', using_expression);
  END IF;
  
  -- Add WITH CHECK clause if provided
  IF check_expression IS NOT NULL THEN
    sql_statement := sql_statement || format(' WITH CHECK (%s)', check_expression);
  END IF;
  
  -- Execute the statement
  EXECUTE sql_statement;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating policy %I on %I: %', policy_name, table_name, SQLERRM;
    RETURN false;
END;
$$;

-- Function to increment thread count for parent messages
CREATE OR REPLACE FUNCTION increment_thread_count(parent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE direct_messages
  SET thread_count = thread_count + 1
  WHERE id = parent_id;
END;
$$;
