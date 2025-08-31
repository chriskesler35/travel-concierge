import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvokeLLM } from '@/api/integrations';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestPage() {
    const [isTestingAI, setIsTestingAI] = useState(false);
    const [aiTestResult, setAiTestResult] = useState(null);

    const handleTestAI = async () => {
        setIsTestingAI(true);
        setAiTestResult(null);
        
        try {
            // Use the frontend integration directly instead of backend function
            const response = await InvokeLLM({
                prompt: 'Please respond with exactly: "AI API is working correctly from frontend"',
                add_context_from_internet: false
            });
            
            setAiTestResult({
                success: true,
                aiResponse: response,
                method: 'Frontend Integration',
                message: 'AI API test completed successfully'
            });
        } catch (error) {
            console.error('Frontend integration test failed:', error);
            setAiTestResult({
                success: false,
                error: error.message,
                details: 'Frontend integration call failed'
            });
        } finally {
            setIsTestingAI(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">AI API Diagnostic Test</h1>
            
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Test AI Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button 
                        onClick={handleTestAI} 
                        disabled={isTestingAI}
                        className="w-full"
                    >
                        {isTestingAI ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing AI API...
                            </>
                        ) : (
                            'Test AI API'
                        )}
                    </Button>
                    
                    {aiTestResult && (
                        <div className={`p-4 rounded-lg border ${
                            aiTestResult.success 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center mb-2">
                                {aiTestResult.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                )}
                                <h3 className="font-semibold">
                                    {aiTestResult.success ? 'AI API Test Passed' : 'AI API Test Failed'}
                                </h3>
                            </div>
                            
                            {aiTestResult.success ? (
                                <div>
                                    <p><strong>Response:</strong> {aiTestResult.aiResponse}</p>
                                    <p><strong>Method:</strong> {aiTestResult.method}</p>
                                    <p><strong>Message:</strong> {aiTestResult.message}</p>
                                </div>
                            ) : (
                                <div>
                                    <p><strong>Error:</strong> {aiTestResult.error}</p>
                                    {aiTestResult.details && (
                                        <p><strong>Details:</strong> {aiTestResult.details}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}