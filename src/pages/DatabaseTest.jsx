import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DatabaseTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const requiredTables = [
    'journeys',
    'feedback', 
    'discount_codes',
    'user_usage_stats',
    'airports',
    'conversation_history',
    'file_uploads'
  ];

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    const testResults = {
      connection: false,
      tables: {},
      sampleData: {},
      summary: { passed: 0, failed: 0 }
    };

    try {
      // Test connection
      const { data: connTest, error: connError } = await supabase
        .from('airports')
        .select('count', { count: 'exact', head: true });
      
      testResults.connection = !connError;

      // Check each table
      for (const table of requiredTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true });
          
          testResults.tables[table] = !error;
          if (!error) {
            testResults.summary.passed++;
          } else {
            testResults.summary.failed++;
          }
        } catch (err) {
          testResults.tables[table] = false;
          testResults.summary.failed++;
        }
      }

      // Check sample data
      try {
        const { data: airports, error: airportError } = await supabase
          .from('airports')
          .select('*');
        
        testResults.sampleData.airports = !airportError ? airports.length : 0;
      } catch (err) {
        testResults.sampleData.airports = 0;
      }

      try {
        const { data: codes, error: codeError } = await supabase
          .from('discount_codes')
          .select('*');
        
        testResults.sampleData.discountCodes = !codeError ? codes.length : 0;
      } catch (err) {
        testResults.sampleData.discountCodes = 0;
      }

      setResults(testResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  const allTablesPassed = results?.summary?.failed === 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Supabase Database Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Connection Status</h3>
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking connection...
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center gap-2">
                {results?.connection ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">Connected to Supabase</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">Connection failed</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tables Status */}
          {results && (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Tables Status
                  <Badge className="ml-2" variant={allTablesPassed ? "success" : "destructive"}>
                    {results.summary.passed}/{requiredTables.length} Passed
                  </Badge>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(results.tables).map(([table, exists]) => (
                    <div key={table} className="flex items-center gap-2 p-2 rounded border">
                      {exists ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={exists ? "text-green-700" : "text-red-700"}>
                        {table}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Data */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Sample Data</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span>Airports</span>
                    <Badge variant={results.sampleData.airports > 0 ? "success" : "secondary"}>
                      {results.sampleData.airports} records
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span>Discount Codes</span>
                    <Badge variant={results.sampleData.discountCodes > 0 ? "success" : "secondary"}>
                      {results.sampleData.discountCodes} records
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <Alert className={allTablesPassed ? "border-green-500" : "border-yellow-500"}>
                <AlertDescription>
                  {allTablesPassed ? (
                    <span className="text-green-700 font-semibold">
                      ✅ Database is fully set up and ready to use!
                    </span>
                  ) : (
                    <span className="text-yellow-700">
                      ⚠️ Some tables are missing. Please run the migration script.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </>
          )}

          <Button onClick={checkDatabase} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-check Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}