import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, MessageSquare, Users } from 'lucide-react';
import { taskService, Task, TaskAnnotation } from '../../services/taskService';
import { Button } from '../../components/common/Button';
import { FileViewer } from '../../components/FileViewer';

export const ReviewTask = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [annotations, setAnnotations] = useState<TaskAnnotation[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<TaskAnnotation | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consensusView, setConsensusView] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      loadTaskForReview();
    }
  }, [taskId]);

  const loadTaskForReview = async () => {
    try {
      setError(null);
      const taskData = await taskService.getTaskDetails(taskId!);
      setTask(taskData);

      // Get questions from dataPayload
      if (taskData.dataPayload?.annotationQuestions) {
        setQuestions(taskData.dataPayload.annotationQuestions);
      }

      const annotationsData = await taskService.getTaskAnnotations(taskId!);
      setAnnotations(annotationsData);
      if (annotationsData.length > 0) {
        setSelectedAnnotation(annotationsData[0]);
      }
    } catch (error: any) {
      console.error('Error loading task for review:', error);
      setError(error.response?.data?.message || 'Failed to load task');
      setTimeout(() => navigate('/review/queue'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (annotationId: string) => {
    setSubmitting(true);
    try {
      await taskService.approveAnnotation(
        taskId!,
        annotationId,
        feedback,
        undefined // qualityScore - optional
      );
      alert('Annotation approved successfully');
      navigate('/review/queue');
    } catch (error: any) {
      console.error('Error approving annotation:', error);
      alert(error.response?.data?.message || 'Failed to approve annotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (annotationId: string) => {
    if (!feedback.trim()) {
      alert('Please provide feedback for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await taskService.rejectAnnotation(
        taskId!,
        annotationId,
        feedback,
        undefined // qualityScore - optional
      );
      alert('Annotation rejected');
      navigate('/review/queue');
    } catch (error: any) {
      console.error('Error rejecting annotation:', error);
      alert(error.response?.data?.message || 'Failed to reject annotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async (annotationId: string) => {
    if (!feedback.trim()) {
      alert('Please provide feedback for revision request');
      return;
    }

    setSubmitting(true);
    try {
      await taskService.requestRevision(
        taskId!,
        annotationId,
        feedback
      );
      alert('Revision requested');
      navigate('/review/queue');
    } catch (error: any) {
      console.error('Error requesting revision:', error);
      alert(error.response?.data?.message || 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  const getConsensusForQuestion = (questionId: string) => {
    const answers = annotations.map(a => a.responses[questionId]).filter(Boolean);
    if (answers.length === 0) return null;

    const answerCounts = answers.reduce((acc: any, answer) => {
      const key = JSON.stringify(answer);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const maxCount = Math.max(...Object.values(answerCounts) as number[]);
    const mostCommon = Object.entries(answerCounts).find(([_, count]) => count === maxCount);

    return {
      answer: mostCommon ? JSON.parse(mostCommon[0]) : null,
      agreement: (maxCount / answers.length) * 100,
      total: answers.length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/review/queue')}>Back to Queue</Button>
        </div>
      </div>
    );
  }

  if (!task || annotations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">No annotations available for this task</p>
          <Button onClick={() => navigate('/review/queue')} className="mt-4">
            Back to Queue
          </Button>
        </div>
      </div>
    );
  }

  const file = task.file?.[0];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate('/review/queue')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Review Task #{taskId?.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-600">
                {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} submitted
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConsensusView(!consensusView)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                consensusView
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              {consensusView ? 'Consensus View' : 'Individual View'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 bg-gray-900 relative">
          {task.fileUrl && task.fileType && (
            <FileViewer
              fileUrl={task.fileUrl}
              fileType={task.fileType}
              metadata={task.fileMetadata}
            />
          )}
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            {!consensusView && (
              <div className="flex gap-2 overflow-x-auto">
                {annotations.map((annotation) => (
                  <button
                    key={annotation.id}
                    onClick={() => setSelectedAnnotation(annotation)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedAnnotation?.id === annotation.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {annotation.userName || `User ${annotation.userId.slice(0, 8)}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {consensusView ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Consensus View</h3>
                  <p className="text-sm text-blue-700">
                    Showing aggregated responses from {annotations.length} annotator{annotations.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {questions.map((question) => {
                  const consensus = getConsensusForQuestion(question.id);

                  return (
                    <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">{question.question_text}</h3>

                      {consensus && (
                        <>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Agreement</span>
                              <span className={`text-sm font-medium ${
                                consensus.agreement >= 80
                                  ? 'text-green-600'
                                  : consensus.agreement >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}>
                                {consensus.agreement.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  consensus.agreement >= 80
                                    ? 'bg-green-500'
                                    : consensus.agreement >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${consensus.agreement}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Most common answer:</p>
                            <p className="text-gray-900 font-medium">
                              {typeof consensus.answer === 'object'
                                ? JSON.stringify(consensus.answer, null, 2)
                                : String(consensus.answer)}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Individual responses:</p>
                            {annotations.map((annotation) => (
                              <div
                                key={annotation.annotation_id}
                                className="text-sm text-gray-600 flex items-start gap-2"
                              >
                                <span className="font-medium min-w-[120px]">
                                  {annotation.user_name}:
                                </span>
                                <span>
                                  {annotation.responses[question.id]
                                    ? typeof annotation.responses[question.id] === 'object'
                                      ? JSON.stringify(annotation.responses[question.id])
                                      : String(annotation.responses[question.id])
                                    : 'No response'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              selectedAnnotation && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedAnnotation.user_name}</h3>
                        <p className="text-sm text-gray-600">{selectedAnnotation.user_email}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Time spent: {Math.floor(selectedAnnotation.time_spent / 60)} min</p>
                        <p>Submitted: {new Date(selectedAnnotation.submitted_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {questions.map((question) => (
                    <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">{question.question_text}</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900">
                          {selectedAnnotation.responses[question.id]
                            ? typeof selectedAnnotation.responses[question.id] === 'object'
                              ? JSON.stringify(selectedAnnotation.responses[question.id], null, 2)
                              : String(selectedAnnotation.responses[question.id])
                            : 'No response'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the annotator(s)..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() =>
                  handleApprove(
                    selectedAnnotation?.annotation_id || annotations[0]?.annotation_id
                  )
                }
                disabled={submitting}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  handleRequestRevision(
                    selectedAnnotation?.annotation_id || annotations[0]?.annotation_id
                  )
                }
                disabled={submitting}
                className="flex-1"
              >
                Request Revision
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  handleReject(
                    selectedAnnotation?.annotation_id || annotations[0]?.annotation_id
                  )
                }
                disabled={submitting}
                className="flex-1 !border-red-300 !text-red-600 hover:!bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
