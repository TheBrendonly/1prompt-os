import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, User, Folder, Settings, CheckSquare, Calendar, ExternalLink, Copy, Globe } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { nanoid } from 'nanoid';
import ClientPortalGuide from '@/components/client-portal/ClientPortalGuide';


interface Portal {
  id: string;
  name: string;
  deployment_slug: string | null;
  is_published: boolean;
  client_id: string;
}

interface Phase {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  portal_id: string;
}

interface Step {
  id: string;
  phase_id: string;
  name: string;
  content: any;
  order_index: number;
  show_to_client: boolean;
}

interface StepCompletion {
  step_id: string;
  completed: boolean;
  form_data: any;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  order_index: number;
}

interface TaskCompletion {
  task_id: string;
  completed: boolean;
}

const ClientPortal = () => {
  const { clientId } = useParams();

  usePageHeader({ title: 'Client Portal' });
  const [loading, setLoading] = useState(true);
  const [portal, setPortal] = useState<Portal | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepCompletions, setStepCompletions] = useState<StepCompletion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deploySlug, setDeploySlug] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchPortalData();
    }
  }, [clientId]);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      // Fetch or create portal
      let { data: portalData, error: portalError } = await supabase
        .from('client_portals')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (portalError && portalError.code === 'PGRST116') {
        // Create default portal with initial phases
        const { data: newPortal, error: createError } = await supabase
          .from('client_portals')
          .insert({ client_id: clientId, name: 'Client Onboarding Portal' })
          .select()
          .single();

        if (createError) throw createError;
        portalData = newPortal;

        // Create initial phases
        await createInitialPhases(newPortal.id);
      } else if (portalError) {
        throw portalError;
      }

      setPortal(portalData);
      setDeploySlug(portalData?.deployment_slug || '');

      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('portal_phases')
        .select('*')
        .eq('portal_id', portalData?.id)
        .order('order_index');

      if (phasesError) throw phasesError;
      setPhases(phasesData || []);

      // Fetch steps
      if (phasesData && phasesData.length > 0) {
        const phaseIds = phasesData.map(p => p.id);
        const { data: stepsData, error: stepsError } = await supabase
          .from('portal_steps')
          .select('*')
          .in('phase_id', phaseIds)
          .order('order_index');

        if (stepsError) throw stepsError;
        setSteps(stepsData || []);
      }

      // Fetch step completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('portal_step_completions')
        .select('step_id, completed, form_data')
        .eq('portal_id', portalData?.id);

      if (!completionsError) {
        setStepCompletions(completionsData || []);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('portal_tasks')
        .select('*')
        .eq('portal_id', portalData?.id)
        .order('order_index');

      if (!tasksError) {
        setTasks(tasksData || []);
      }

      // Fetch task completions
      const { data: taskCompletionsData, error: taskCompletionsError } = await supabase
        .from('portal_task_completions')
        .select('task_id, completed')
        .eq('portal_id', portalData?.id);

      if (!taskCompletionsError) {
        setTaskCompletions(taskCompletionsData || []);
      }
    } catch (error) {
      console.error('Error fetching portal data:', error);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const createInitialPhases = async (portalId: string) => {
    // Create initial phases with steps
    const initialPhases = [
      {
        name: 'Accounts',
        description: 'Connect your social media accounts',
        order_index: 0,
        steps: [
          { name: 'LinkedIn Account', order_index: 0, content: { type: 'social_link', platform: 'linkedin', label: 'Please provide your LinkedIn profile URL', checkbox: "I don't have a LinkedIn account" } },
          { name: 'YouTube Channel', order_index: 1, content: { type: 'social_link', platform: 'youtube', label: 'Please provide your YouTube channel URL', checkbox: "I don't have a YouTube channel" } },
          { name: 'Instagram Account', order_index: 2, content: { type: 'social_link', platform: 'instagram', label: 'Please provide your Instagram profile URL', checkbox: "I don't have an Instagram account" } },
          { name: 'Newsletter', order_index: 3, content: { type: 'newsletter_question', label: 'Do you have a newsletter?', options: ['Kit', 'Beehive', 'Active Campaign', 'MailChimp', 'Other'] } },
        ]
      },
      {
        name: 'Webinar Setup',
        description: 'Configure your webinar settings',
        order_index: 1,
        steps: [
          { name: 'Zoom Subscription', order_index: 0, content: { type: 'checkbox_confirm', label: 'Zoom Subscription Required', description: 'You need to have a Zoom subscription. Please purchase Zoom Webinar subscription and ensure the license is attached to your user account.', checkbox: 'I have completed this step' } },
        ]
      },
      {
        name: 'HighLevel Setup',
        description: 'Configure your HighLevel account',
        order_index: 2,
        steps: [
          { name: 'HighLevel Account', order_index: 0, content: { type: 'highlevel_setup', label: 'Do you have your own HighLevel account?', yesFields: ['Sub-account name', 'Sub-account login URL'], yesInstructions: 'Please provide admin access to your sub-account to: eugene.kadzin@gmail.com' } },
        ]
      },
    ];

    for (const phase of initialPhases) {
      const { data: phaseData, error: phaseError } = await supabase
        .from('portal_phases')
        .insert({
          portal_id: portalId,
          name: phase.name,
          description: phase.description,
          order_index: phase.order_index
        })
        .select()
        .single();

      if (phaseError) continue;

      for (const step of phase.steps) {
        await supabase
          .from('portal_steps')
          .insert({
            phase_id: phaseData.id,
            name: step.name,
            content: step.content,
            order_index: step.order_index,
            show_to_client: true
          });
      }
    }
  };

  const getPhaseStatus = (phase: Phase) => {
    const phaseSteps = steps.filter(s => s.phase_id === phase.id && s.show_to_client);
    const completedSteps = phaseSteps.filter(s => 
      stepCompletions.find(c => c.step_id === s.id && c.completed)
    );
    
    return {
      completed: completedSteps.length,
      total: phaseSteps.length,
      percentage: phaseSteps.length > 0 ? Math.round((completedSteps.length / phaseSteps.length) * 100) : 0,
      isComplete: phaseSteps.length > 0 && completedSteps.length >= phaseSteps.length
    };
  };

  const getOverallProgress = () => {
    let totalSteps = 0;
    let completedSteps = 0;
    phases.forEach(phase => {
      const status = getPhaseStatus(phase);
      totalSteps += status.total;
      completedSteps += status.completed;
    });
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    };
  };

  const handlePhaseClick = (phase: Phase) => {
    setSelectedPhase(phase);
    setShowGuide(true);
  };

  const handleTaskToggle = async (task: Task) => {
    if (!portal) return;

    const currentCompletion = taskCompletions.find(c => c.task_id === task.id);
    const newCompleted = !currentCompletion?.completed;

    // Optimistic update
    setTaskCompletions(prev => {
      const existing = prev.find(c => c.task_id === task.id);
      if (existing) {
        return prev.map(c => c.task_id === task.id ? { ...c, completed: newCompleted } : c);
      }
      return [...prev, { task_id: task.id, completed: newCompleted }];
    });

    try {
      const { error } = await supabase
        .from('portal_task_completions')
        .upsert({
          task_id: task.id,
          portal_id: portal.id,
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null
        }, { onConflict: 'task_id,portal_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task completion:', error);
      toast.error('Failed to update task');
      // Revert on error
      fetchPortalData();
    }
  };

  const handleDeploy = async () => {
    if (!portal) return;

    try {
      const slug = deploySlug || nanoid(10);
      const { error } = await supabase
        .from('client_portals')
        .update({ 
          deployment_slug: slug,
          is_published: true 
        })
        .eq('id', portal.id);

      if (error) throw error;

      setPortal(prev => prev ? { ...prev, deployment_slug: slug, is_published: true } : null);
      setDeploySlug(slug);
      toast.success('Portal published successfully!');
      setShowDeployDialog(false);
    } catch (error) {
      console.error('Error deploying portal:', error);
      toast.error('Failed to publish portal');
    }
  };

  const copyPortalUrl = () => {
    if (portal?.deployment_slug) {
      const url = `${window.location.origin}/portal/${portal.deployment_slug}`;
      navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col">
      <div className="container mx-auto max-w-7xl flex flex-col h-full">
        {/* Header with Deploy Button */}
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Client Portal</h1>
            <p className="text-sm text-muted-foreground">Manage client onboarding and tasks</p>
          </div>
          <div className="flex gap-2">
            {portal?.is_published && portal.deployment_slug && (
              <Button variant="outline" onClick={copyPortalUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            )}
            <Button onClick={() => setShowDeployDialog(true)}>
              <Globe className="h-4 w-4 mr-2" />
              {portal?.is_published ? 'Update Deployment' : 'Deploy Portal'}
            </Button>
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="flex-shrink-0">
          <Card className="material-surface mb-6">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Onboarding Progress</CardTitle>
                  <CardDescription className="mt-1">
                    Complete all phases to finish onboarding
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-[24px] font-bold text-primary">
                    {overallProgress.percentage}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {overallProgress.completed}/{overallProgress.total} steps
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={overallProgress.percentage} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-auto pb-6 space-y-6">
          {/* Onboarding Phases Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Onboarding Phases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {phases.map(phase => {
                const status = getPhaseStatus(phase);
                return (
                  <Card
                    key={phase.id}
                    onClick={() => handlePhaseClick(phase)}
                    className={cn(
                      "material-surface cursor-pointer transition-all hover:shadow-md border-2",
                      status.isComplete
                        ? "border-green-500 bg-green-50/30 dark:bg-green-950/10"
                        : status.completed > 0
                        ? "border-amber-500 bg-amber-50/30 dark:bg-amber-950/10"
                        : "border-red-500 bg-red-50/30 dark:bg-red-950/10"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            status.isComplete
                              ? "bg-green-100 dark:bg-green-900/30"
                              : status.completed > 0
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : "bg-red-100 dark:bg-red-900/30"
                          )}
                        >
                          <Folder
                            className={cn(
                              "h-5 w-5",
                              status.isComplete
                                ? "text-green-600 dark:text-green-400"
                                : status.completed > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                              {phase.name}
                            </h3>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                status.isComplete
                                  ? "text-green-600"
                                  : status.completed > 0
                                  ? "text-amber-600"
                                  : "text-red-600"
                              )}
                            />
                          </div>
                          {phase.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {phase.description}
                            </p>
                          )}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {status.completed}/{status.total} steps
                              </span>
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  status.isComplete
                                    ? "text-green-600"
                                    : status.completed > 0
                                    ? "text-amber-600"
                                    : "text-red-600"
                                )}
                              >
                                {status.percentage}%
                              </span>
                            </div>
                            <Progress
                              value={status.percentage}
                              className={cn(
                                "h-1.5",
                                status.isComplete && "[&>div]:bg-green-500",
                                status.completed > 0 && !status.isComplete && "[&>div]:bg-amber-500",
                                status.completed === 0 && "[&>div]:bg-red-500"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* To-Do List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">To Do</h2>
            {tasks.length === 0 ? (
              <Card className="material-surface">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No tasks assigned yet. Tasks will appear here when added.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const isCompleted = taskCompletions.find(c => c.task_id === task.id)?.completed || false;
                  return (
                    <Card 
                      key={task.id} 
                      className="material-surface cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => handleTaskToggle(task)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium",
                              isCompleted && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portal Guide Dialog */}
      {showGuide && selectedPhase && portal && (
        <ClientPortalGuide
          open={showGuide}
          onOpenChange={setShowGuide}
          portalId={portal.id}
          initialPhase={phases.findIndex(p => p.id === selectedPhase.id)}
          phases={phases}
          steps={steps}
          stepCompletions={stepCompletions}
          onCompletionChange={fetchPortalData}
          isAdmin={true}
          onDataChange={fetchPortalData}
        />
      )}

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            {selectedTask?.due_date && (
              <DialogDescription className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due: {new Date(selectedTask.due_date).toLocaleDateString()}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {selectedTask?.description || 'No description provided.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
            {selectedTask && (
              <Button 
                onClick={() => {
                  handleTaskToggle(selectedTask);
                  setSelectedTask(null);
                }}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {taskCompletions.find(c => c.task_id === selectedTask.id)?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deploy Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Client Portal</DialogTitle>
            <DialogDescription>
              Generate a public URL for clients to access their onboarding portal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Portal URL Slug</Label>
              <Input
                id="slug"
                placeholder="custom-slug (leave empty for auto-generate)"
                value={deploySlug}
                onChange={(e) => setDeploySlug(e.target.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase())}
              />
              <p className="text-xs text-muted-foreground">
                URL: {window.location.origin}/portal/{deploySlug || '[auto-generated]'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeploy}>
              <Globe className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPortal;
