"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllTableSecurityStatus, type TableSecurityStatus } from "@/lib/supabase/security-utils"
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"

export default function SecurityAuditPage() {
  const [tableStatus, setTableStatus] = useState<TableSecurityStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [applyingFix, setApplyingFix] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSecurityStatus() {
      setLoading(true)
      try {
        const status = await getAllTableSecurityStatus()
        setTableStatus(status)
      } catch (error) {
        console.error("Error fetching security status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSecurityStatus()
  }, [refreshKey])

  const secureCount = tableStatus.filter((t) => t.isSecure).length
  const insecureCount = tableStatus.length - secureCount
  const securityScore = tableStatus.length > 0 ? Math.round((secureCount / tableStatus.length) * 100) : 0

  const refreshStatus = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const applySecurityFix = async (tableName: string) => {
    setApplyingFix(tableName)
    try {
      const response = await fetch(`/api/security/apply-policy?table=${tableName}`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply security fix")
      }

      // Wait a moment to ensure changes are applied
      setTimeout(() => {
        refreshStatus()
        setApplyingFix(null)
      }, 1000)
    } catch (error) {
      console.error("Error applying security fix:", error)
      setApplyingFix(null)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Database Security Audit</h1>
        </div>
        <Button onClick={refreshStatus} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{securityScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {secureCount} of {tableStatus.length} tables secured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Secure Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{secureCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Tables with RLS enabled and policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vulnerable Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{insecureCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Tables without proper security</p>
          </CardContent>
        </Card>
      </div>

      {insecureCount > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Vulnerabilities Detected</AlertTitle>
          <AlertDescription>
            {insecureCount} tables in your database have insufficient security. Apply the recommended fixes below.
          </AlertDescription>
        </Alert>
      )}

      {insecureCount === 0 && tableStatus.length > 0 && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">All Tables Secured</AlertTitle>
          <AlertDescription>All tables in your database have proper Row Level Security enabled.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tables</TabsTrigger>
          <TabsTrigger value="secure">Secure</TabsTrigger>
          <TabsTrigger value="vulnerable">Vulnerable</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TableSecurityList
            tables={tableStatus}
            loading={loading}
            onApplyFix={applySecurityFix}
            applyingFix={applyingFix}
          />
        </TabsContent>

        <TabsContent value="secure">
          <TableSecurityList
            tables={tableStatus.filter((t) => t.isSecure)}
            loading={loading}
            onApplyFix={applySecurityFix}
            applyingFix={applyingFix}
          />
        </TabsContent>

        <TabsContent value="vulnerable">
          <TableSecurityList
            tables={tableStatus.filter((t) => !t.isSecure)}
            loading={loading}
            onApplyFix={applySecurityFix}
            applyingFix={applyingFix}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TableSecurityListProps {
  tables: TableSecurityStatus[]
  loading: boolean
  onApplyFix: (tableName: string) => void
  applyingFix: string | null
}

function TableSecurityList({ tables, loading, onApplyFix, applyingFix }: TableSecurityListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (tables.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">No tables found in this category.</div>
  }

  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <Card key={table.tableName} className={table.isSecure ? "border-green-200" : "border-red-200"}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">{table.tableName}</CardTitle>
              {table.isSecure ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Secured
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Vulnerable
                </Badge>
              )}
            </div>
            <CardDescription>
              {table.hasRls ? "Row Level Security is enabled" : "Row Level Security is NOT enabled"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <Shield className={`h-4 w-4 mr-2 ${table.hasRls ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm">RLS Status: {table.hasRls ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex items-center">
                <Shield className={`h-4 w-4 mr-2 ${table.policies.length > 0 ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm">Policies: {table.policies.length}</span>
              </div>
            </div>

            {table.policies.length > 0 && (
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="policies">
                  <AccordionTrigger className="text-sm">View Policies</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      {table.policies.map((policy, index) => (
                        <div key={index} className="border rounded-md p-2">
                          <div className="font-medium">{policy.policyName}</div>
                          <div className="text-xs text-muted-foreground">Operation: {policy.operation}</div>
                          <div className="text-xs mt-1 font-mono bg-muted p-1 rounded">{policy.definition}</div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
          {!table.isSecure && (
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onApplyFix(table.tableName)}
                disabled={applyingFix === table.tableName}
              >
                {applyingFix === table.tableName ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Applying Fix...
                  </>
                ) : (
                  "Apply Security Fix"
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}

// Add dynamic export to prevent prerendering
export const dynamic = "force-dynamic"
