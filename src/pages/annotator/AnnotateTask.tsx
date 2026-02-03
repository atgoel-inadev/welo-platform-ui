import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Send, Clock } from 'lucide-react';
import { taskService, AnnotationResponse } from '../../services/taskService';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { FileViewer } from '../../components/FileViewer';
import { QuestionRenderer } from '../../components/annotator/QuestionRenderer';

export const AnnotateTask = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(Date.now());
  const [assignmentId, setAssignmentId] = useState<string>('');

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      const taskData = await taskService.getTaskDetails(taskId!);
      setTask(taskData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, status')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (assignments && assignments.length > 0) {
        setAssignmentId(assignments[0].id);

        if (assignments[0].status === 'ASSIGNED') {
          await taskService.startTask(taskId!, assignments[0].id);
        }
      }

      if (taskData.workflow_id) {
        const questionsData = await taskService.getWorkflowQuestions(taskData.workflow_id);
        setQuestions(questionsData);
      } else if (taskData.project?.annotation_questions) {
        setQuestions(taskData.project.annotation_questions);
      }
    } catch (error) {
      console.error('Error loading task:', error);
      alert('Failed to load task');
      navigate('/annotate/queue');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, answer: any) => {
    setResponses(new Map(responses.set(questionId, answer)));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const responseData: AnnotationResponse[] = Array.from(responses.entries()).map(
        ([question_id, answer]) => ({
          question_id,
          answer
        })
      );

      await taskService.saveDraft(taskId!, assignmentId, responseData);
      alert('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const validateResponses = (): boolean => {
    const requiredQuestions = questions.filter(q => q.is_required);
    for (const question of requiredQuestions) {
      const response = responses.get(question.id);
      if (!response || (typeof response === 'string' && response.trim() === '')) {
        alert(`Please answer the required question: ${question.question_text}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      return;
    }

    setSubmitting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const responseData: AnnotationResponse[] = Array.from(responses.entries()).map(
        ([question_id, answer]) => ({
          question_id,
          answer,
          time_spent: timeSpent / questions.length
        })
      );

      await taskService.submitAnnotation(taskId!, assignmentId, responseData, timeSpent);
      alert('Annotation submitted successfully!');
      navigate('/annotate/queue');
    } catch (error) {
      console.error('Error submitting annotation:', error);
      alert('Failed to submit annotation');
    } finally {
      setSubmitting(false);
    }
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

  if (!task || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">No questions available for this task</p>
          <Button onClick={() => navigate('/annotate/queue')} className="mt-4">
            Back to Queue
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const file = task.file?.[0];
  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/annotate/queue')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Task #{taskId?.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{Math.floor((Date.now() - startTime) / 60000)} min</span>
            </div>
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 bg-gray-900 relative">
          {file && (
            <FileViewer
              fileUrl={file.file_url}
              fileType={file.file_type}
              metadata={file.file_metadata}
            />
          )}
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <QuestionRenderer
              question={currentQuestion}
              value={responses.get(currentQuestion.id)}
              onChange={(value) => handleResponseChange(currentQuestion.id, value)}
            />
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Annotation
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
