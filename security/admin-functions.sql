-- Create admin functions for managing RLS

-- Function to enable RLS on a table
CREATE OR REPLACE FUNCTION enable_rls(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a policy
CREATE OR REPLACE FUNCTION create_policy(
  table_name text,
  policy_name text,
  operation text,
  using_expr text DEFAULT NULL,
  check_expr text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  sql_statement text;
BEGIN
  sql_statement := format('CREATE POLICY %I ON %I FOR %s', 
                         policy_name, table_name, operation);
  
  IF using_expr IS NOT NULL THEN
    sql_statement := sql_statement || format(' USING (%s)', using_expr);
  END IF;
  
  IF check_expr IS NOT NULL THEN
    sql_statement := sql_statement || format(' WITH CHECK (%s)', check_expr);
  END IF;
  
  EXECUTE sql_statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
