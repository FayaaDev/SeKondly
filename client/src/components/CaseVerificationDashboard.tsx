/**
 * Admin Case Verification Dashboard Component
 * 
 * This component provides administrators with tools to review cases
 * that have been flagged by the AI verification system.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, Shield, AlertTriangle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface CaseWithVerification {
  id: number;
  title: string;
  history: string;
  specialty: string;
  format: 'short' | 'long';
  verificationStatus: 'pending' | 'verified' | 'flagged' | 'failed';
  verificationConfidence: number;
  requiresManualReview: boolean;
  verificationViolations: number;
  verificationTimestamp: string;
  verificationSummary: VerificationViolation[];
  verificationNotes?: string;
  author: {
    firstName: string;
    lastName: string;
    email: string;
    specialty: string;
  };
  imageUrls?: string[];
  createdAt: string;
}

interface VerificationViolation {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
}

interface VerificationStats {
  pending: number;
  flagged: number;
  verified: number;
  failed: number;
  requiresReview: number;
}

export default function CaseVerificationDashboard() {
  const [selectedCase, setSelectedCase] = useState<CaseWithVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch verification statistics
  const { data: stats } = useQuery<VerificationStats>({
    queryKey: ['/api/admin/verification/stats'],
  });

  // Fetch cases needing review
  const { data: flaggedCases = [], isLoading } = useQuery<CaseWithVerification[]>({
    queryKey: ['/api/admin/verification/flagged-cases'],
  });

  // Fetch all verification cases with filters
  const { data: allCases = [] } = useQuery<CaseWithVerification[]>({
    queryKey: ['/api/admin/verification/all-cases'],
  });

  // Manual approval mutation
  const approveMutation = useMutation({
    mutationFn: async ({ caseId, notes }: { caseId: number; notes: string }) => {
      const response = await fetch(`/api/admin/verification/approve/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve case');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification'] });
      setSelectedCase(null);
      setReviewNotes('');
    },
  });

  // Manual rejection mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ caseId, notes }: { caseId: number; notes: string }) => {
      const response = await fetch(`/api/admin/verification/reject/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to reject case');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verification'] });
      setSelectedCase(null);
      setReviewNotes('');
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'flagged': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'flagged': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Flagged</p>
                <p className="text-2xl font-bold">{stats?.flagged || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-2xl font-bold">{stats?.verified || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold">{stats?.failed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Need Review</p>
                <p className="text-2xl font-bold">{stats?.requiresReview || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flagged" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flagged">Flagged Cases ({flaggedCases.length})</TabsTrigger>
          <TabsTrigger value="all">All Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>Cases Requiring Review</span>
              </CardTitle>
              <CardDescription>
                Cases flagged by AI verification system for potential privacy violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : flaggedCases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No cases currently flagged for review
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedCases.map((case_) => (
                    <Card key={case_.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(case_.verificationStatus)}
                              <h3 className="font-semibold">{case_.title}</h3>
                              <Badge variant="outline">{case_.specialty}</Badge>
                              <Badge className={getStatusColor(case_.verificationStatus)}>
                                {case_.verificationStatus}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {case_.history}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Author: {case_.author.firstName} {case_.author.lastName}</span>
                              <span>Confidence: {case_.verificationConfidence}%</span>
                              <span>Violations: {case_.verificationViolations}</span>
                              {case_.imageUrls?.length && (
                                <span>Images: {case_.imageUrls.length}</span>
                              )}
                            </div>
                            
                            {case_.verificationSummary && case_.verificationSummary.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {case_.verificationSummary.map((violation, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant={getSeverityColor(violation.severity) as any}
                                    className="text-xs"
                                  >
                                    {violation.type} ({violation.severity})
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCase(case_)}
                            className="ml-4"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Verification Cases</CardTitle>
              <CardDescription>
                Complete list of cases with verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allCases.map((case_) => (
                  <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(case_.verificationStatus)}
                      <div>
                        <h4 className="font-medium">{case_.title}</h4>
                        <p className="text-sm text-gray-500">
                          {case_.author.firstName} {case_.author.lastName} • {case_.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(case_.verificationStatus)}>
                        {case_.verificationStatus}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {case_.verificationConfidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Review Modal */}
      {selectedCase && (
        <Card className="fixed inset-4 z-50 bg-white shadow-xl border overflow-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Review Case: {selectedCase.title}</span>
              </CardTitle>
              <CardDescription>
                Submitted by {selectedCase.author.firstName} {selectedCase.author.lastName}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setSelectedCase(null)}>
              ×
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Verification Summary */}
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <span>Status: <Badge className={getStatusColor(selectedCase.verificationStatus)}>{selectedCase.verificationStatus}</Badge></span>
                    <span>Confidence: {selectedCase.verificationConfidence}%</span>
                    <span>Violations: {selectedCase.verificationViolations}</span>
                  </div>
                  
                  {selectedCase.verificationSummary && selectedCase.verificationSummary.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-medium">Detected Issues:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCase.verificationSummary.map((violation, idx) => (
                          <Badge 
                            key={idx} 
                            variant={getSeverityColor(violation.severity) as any}
                          >
                            {violation.type} ({violation.severity}, {violation.confidence}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Case Content */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Case History</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedCase.history}</p>
              </div>
              
              {selectedCase.imageUrls && selectedCase.imageUrls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Images ({selectedCase.imageUrls.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCase.imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Case image ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Review Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes</label>
              <Textarea
                placeholder="Add notes about your review decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ 
                  caseId: selectedCase.id, 
                  notes: reviewNotes 
                })}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Case
              </Button>
              <Button
                onClick={() => approveMutation.mutate({ 
                  caseId: selectedCase.id, 
                  notes: reviewNotes 
                })}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Case
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
