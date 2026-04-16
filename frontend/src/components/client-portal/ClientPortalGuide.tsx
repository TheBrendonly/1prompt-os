import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  Plus, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  MoreHorizontal
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SlashCommandMenu, { BlockType } from './SlashCommandMenu';
import FloatingToolbar from './FloatingToolbar';
import InlineContentBlock, { ContentBlock } from './InlineContentBlock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Phase {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  portal_id?: string;
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

interface ClientPortalGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portalId: string;
  initialPhase?: number;
  phases: Phase[];
  steps: Step[];
  stepCompletions: StepCompletion[];
  onCompletionChange: () => void;
  isAdmin?: boolean;
  onDataChange?: () => void;
}

const ClientPortalGuide: React.FC<ClientPortalGuideProps> = ({
  open,
  onOpenChange,
  portalId,
  initialPhase = 0,
  phases,
  steps,
  stepCompletions,
  onCompletionChange,
  isAdmin = true,
  onDataChange
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(initialPhase);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([initialPhase]));
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Inline editing states
  const [editingPhaseName, setEditingPhaseName] = useState<string | null>(null);
  const [editingStepName, setEditingStepName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'phase' | 'step'; id: string } | null>(null);

  const contentAreaRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);
  const currentPhase = sortedPhases[currentPhaseIndex];
  const isEditing = isAdmin && !isPreviewMode;
  
  const phaseSteps = steps
    .filter(s => s.phase_id === currentPhase?.id && (isEditing || s.show_to_client))
    .sort((a, b) => a.order_index - b.order_index);
  const currentStep = phaseSteps[currentStepIndex];

  // Get content blocks from current step
  const getBlocks = (): ContentBlock[] => {
    if (!currentStep?.content?.blocks) {
      return [];
    }
    return currentStep.content.blocks;
  };

  useEffect(() => {
    if (currentStep) {
      const existingCompletion = stepCompletions.find(c => c.step_id === currentStep.id);
      if (existingCompletion?.form_data) {
        setFormData(existingCompletion.form_data);
      } else {
        setFormData({});
      }
    }
  }, [currentStep?.id, stepCompletions]);

  const isStepCompleted = (stepId: string) => {
    return stepCompletions.find(c => c.step_id === stepId)?.completed || false;
  };

  const isPhaseCompleted = (phaseIndex: number) => {
    const phase = sortedPhases[phaseIndex];
    if (!phase) return false;
    const phaseSteps = steps.filter(s => s.phase_id === phase.id && s.show_to_client);
    if (phaseSteps.length === 0) return false;
    return phaseSteps.every(s => isStepCompleted(s.id));
  };

  // Auto-save blocks with debounce
  const saveBlocks = useCallback(async (blocks: ContentBlock[]) => {
    if (!currentStep || !isEditing) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('portal_steps')
          .update({ content: { blocks } as any })
          .eq('id', currentStep.id);

        if (error) throw error;
        onDataChange?.();
      } catch (error) {
        console.error('Error saving blocks:', error);
      }
    }, 500);
  }, [currentStep, isEditing, onDataChange]);

  const handleBlockUpdate = (updatedBlock: ContentBlock) => {
    const blocks = getBlocks();
    const newBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    saveBlocks(newBlocks);
  };

  const handleBlockDelete = (blockId: string) => {
    const blocks = getBlocks();
    const newBlocks = blocks.filter(b => b.id !== blockId);
    saveBlocks(newBlocks);
  };

  const handleAddBlock = (type: BlockType) => {
    const blocks = getBlocks();
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      styles: {},
      config: {}
    };
    const newBlocks = [...blocks, newBlock];
    saveBlocks(newBlocks);
    setSlashMenuOpen(false);
    setSlashFilter('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === '/' && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenuPosition({ top: rect.bottom + 8, left: rect.left });
        setSlashMenuOpen(true);
        setSlashFilter('');
      }
    }
  };

  // Phase/Step management
  const handleAddPhase = async () => {
    try {
      const newOrder = sortedPhases.length;
      const { data, error } = await supabase
        .from('portal_phases')
        .insert({
          portal_id: portalId,
          name: 'New Phase',
          order_index: newOrder
        })
        .select()
        .single();

      if (error) throw error;
      onDataChange?.();
      toast.success('Phase added');
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('Failed to add phase');
    }
  };

  const handleAddStep = async (phaseId: string) => {
    try {
      const phaseSteps = steps.filter(s => s.phase_id === phaseId);
      const newOrder = phaseSteps.length;
      const { data, error } = await supabase
        .from('portal_steps')
        .insert({
          phase_id: phaseId,
          name: 'New Step',
          content: { blocks: [] },
          order_index: newOrder,
          show_to_client: true
        })
        .select()
        .single();

      if (error) throw error;
      onDataChange?.();
      
      // Navigate to the new step
      const phaseIndex = sortedPhases.findIndex(p => p.id === phaseId);
      if (phaseIndex !== -1) {
        setCurrentPhaseIndex(phaseIndex);
        setCurrentStepIndex(phaseSteps.length);
        setExpandedPhases(prev => new Set([...prev, phaseIndex]));
      }
      
      toast.success('Step added');
    } catch (error) {
      console.error('Error adding step:', error);
      toast.error('Failed to add step');
    }
  };

  const handleRenamePhase = async (phaseId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('portal_phases')
        .update({ name: newName })
        .eq('id', phaseId);

      if (error) throw error;
      onDataChange?.();
      setEditingPhaseName(null);
    } catch (error) {
      console.error('Error renaming phase:', error);
      toast.error('Failed to rename phase');
    }
  };

  const handleRenameStep = async (stepId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('portal_steps')
        .update({ name: newName })
        .eq('id', stepId);

      if (error) throw error;
      onDataChange?.();
      setEditingStepName(null);
    } catch (error) {
      console.error('Error renaming step:', error);
      toast.error('Failed to rename step');
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      // First delete all steps in this phase
      const { error: stepsError } = await supabase
        .from('portal_steps')
        .delete()
        .eq('phase_id', phaseId);

      if (stepsError) throw stepsError;

      const { error } = await supabase
        .from('portal_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;
      onDataChange?.();
      setDeleteConfirm(null);
      toast.success('Phase deleted');
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error('Failed to delete phase');
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      const { error } = await supabase
        .from('portal_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
      onDataChange?.();
      setDeleteConfirm(null);
      toast.success('Step deleted');
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Failed to delete step');
    }
  };

  const handleToggleStepVisibility = async (stepId: string, showToClient: boolean) => {
    try {
      const { error } = await supabase
        .from('portal_steps')
        .update({ show_to_client: showToClient })
        .eq('id', stepId);

      if (error) throw error;
      onDataChange?.();
    } catch (error) {
      console.error('Error toggling step visibility:', error);
      toast.error('Failed to update step');
    }
  };

  const saveStepCompletion = async (completed: boolean) => {
    if (!currentStep) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portal_step_completions')
        .upsert({
          step_id: currentStep.id,
          portal_id: portalId,
          completed,
          form_data: formData,
          completed_at: completed ? new Date().toISOString() : null
        }, { onConflict: 'step_id,portal_id' });

      if (error) throw error;
      onCompletionChange();
    } catch (error) {
      console.error('Error saving step completion:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!currentStep) return;
    
    await saveStepCompletion(true);

    if (currentStepIndex < phaseSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (currentPhaseIndex < sortedPhases.length - 1) {
      const nextPhase = currentPhaseIndex + 1;
      setCurrentPhaseIndex(nextPhase);
      setCurrentStepIndex(0);
      setExpandedPhases(prev => new Set([...prev, nextPhase]));
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else if (currentPhaseIndex > 0) {
      const prevPhase = currentPhaseIndex - 1;
      const prevPhaseSteps = steps
        .filter(s => s.phase_id === sortedPhases[prevPhase]?.id && (isEditing || s.show_to_client))
        .sort((a, b) => a.order_index - b.order_index);
      setCurrentPhaseIndex(prevPhase);
      setCurrentStepIndex(prevPhaseSteps.length - 1);
    }
  };

  const handlePhaseClick = (phaseIndex: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseIndex)) {
        next.delete(phaseIndex);
      } else {
        next.add(phaseIndex);
      }
      return next;
    });
  };

  const handleStepClick = (phaseIndex: number, stepIndex: number) => {
    setCurrentPhaseIndex(phaseIndex);
    setCurrentStepIndex(stepIndex);
    setExpandedPhases(prev => {
      if (!prev.has(phaseIndex)) {
        return new Set([...prev, phaseIndex]);
      }
      return prev;
    });
  };

  const renderStepContent = () => {
    const blocks = getBlocks();

    if (blocks.length === 0 && isEditing) {
      return (
        <div 
          className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground cursor-text border-2 border-dashed border-muted-foreground/20 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            handleAddBlock('paragraph');
          }}
        >
          <p className="text-sm">Click here or type / to add content</p>
        </div>
      );
    }

    if (blocks.length === 0 && !isEditing) {
      return (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            No content configured for this step.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        {blocks.map((block) => (
          <InlineContentBlock
            key={block.id}
            block={block}
            isEditing={isEditing}
            onUpdate={handleBlockUpdate}
            onDelete={() => handleBlockDelete(block.id)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocusedBlockId(block.id)}
            formData={formData}
            onFormDataChange={(key, value) => setFormData(prev => ({ ...prev, [key]: value }))}
          />
        ))}
      </div>
    );
  };

  const isCurrentStepCompleted = currentStep ? isStepCompleted(currentStep.id) : false;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 gap-0 rounded-none overflow-hidden" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Client Portal Onboarding Guide</DialogTitle>
          </VisuallyHidden>

          <div className="flex h-full w-full overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
              <div className="px-6 py-4 flex-shrink-0">
                <h2 className="text-base font-semibold">Client Portal Guide</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Follow everything step-by-step not skipping any single action.
                </p>
              </div>

              <div className="border-t border-border/50 flex-shrink-0" />

              <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 px-2 pb-8 space-y-3">
                {sortedPhases.map((phase, phaseIndex) => {
                  const phaseStepsList = steps
                    .filter(s => s.phase_id === phase.id && (isEditing || s.show_to_client))
                    .sort((a, b) => a.order_index - b.order_index);
                  const phaseCompleted = isPhaseCompleted(phaseIndex);

                  return (
                    <div key={phase.id} className="group/phase">
                      <div className="relative">
                        {/* Phase Header */}
                        {editingPhaseName === phase.id ? (
                          <div className="px-4 py-3">
                            <Input
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onBlur={() => handleRenamePhase(phase.id, tempName)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenamePhase(phase.id, tempName);
                                if (e.key === 'Escape') setEditingPhaseName(null);
                              }}
                              autoFocus
                              className="h-8 text-sm font-bold uppercase"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePhaseClick(phaseIndex)}
                            className={cn(
                              "w-full px-4 py-3 text-left flex items-center gap-3 transition-all border-2 rounded-lg",
                              phaseCompleted
                                ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                                : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                            )}
                          >
                            <h3 className="text-sm font-bold uppercase tracking-wide flex-1 text-foreground">
                              {phase.name}
                            </h3>
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform text-muted-foreground",
                              expandedPhases.has(phaseIndex) && "rotate-90"
                            )} />
                          </button>
                        )}

                        {/* Phase Actions (gear icon) */}
                        {isEditing && editingPhaseName !== phase.id && (
                          <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-muted rounded">
                                  <Settings className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setTempName(phase.name);
                                  setEditingPhaseName(phase.id);
                                }}>
                                  Rename phase
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddStep(phase.id)}>
                                  Add step to this phase
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteConfirm({ type: 'phase', id: phase.id })}
                                >
                                  Delete phase
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>

                      {/* Steps */}
                      {expandedPhases.has(phaseIndex) && (
                        <div>
                          {phaseStepsList.map((step, stepIndex) => {
                            const isActive = phaseIndex === currentPhaseIndex && stepIndex === currentStepIndex;
                            const stepCompleted = isStepCompleted(step.id);
                            
                            return (
                              <div key={step.id} className="group/step relative">
                                {editingStepName === step.id ? (
                                  <div className="pl-3 pr-6 py-2">
                                    <Input
                                      value={tempName}
                                      onChange={(e) => setTempName(e.target.value)}
                                      onBlur={() => handleRenameStep(step.id, tempName)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameStep(step.id, tempName);
                                        if (e.key === 'Escape') setEditingStepName(null);
                                      }}
                                      autoFocus
                                      className="h-7 text-sm"
                                    />
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStepClick(phaseIndex, stepIndex)}
                                    onDoubleClick={() => {
                                      if (isEditing) {
                                        setTempName(step.name);
                                        setEditingStepName(step.id);
                                      }
                                    }}
                                    className={cn(
                                      "w-full pl-3 pr-6 py-3 text-left transition-colors flex items-center gap-3 border-l-2",
                                      isActive
                                        ? "bg-primary/10 border-primary"
                                        : stepCompleted
                                        ? "border-green-500 hover:bg-muted/50"
                                        : "border-transparent hover:bg-muted/50",
                                      !step.show_to_client && "opacity-50"
                                    )}
                                  >
                                    <div className="flex-shrink-0">
                                      {stepCompleted ? (
                                        <CheckCircle2 className="h-[21px] w-[21px] text-green-600 dark:text-green-400" />
                                      ) : (
                                        <div className={cn(
                                          "h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-medium",
                                          isActive
                                            ? "border-primary text-primary"
                                            : "border-muted-foreground text-muted-foreground"
                                        )}>
                                          <span className="mt-px">{stepIndex + 1}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "text-sm font-medium",
                                        isActive ? "text-primary" : "text-foreground"
                                      )}>
                                        {step.name}
                                      </p>
                                    </div>
                                  </button>
                                )}

                                {/* Step Actions */}
                                {isEditing && editingStepName !== step.id && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/step:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                      onClick={() => handleToggleStepVisibility(step.id, !step.show_to_client)}
                                      className="p-1 hover:bg-muted rounded"
                                      title={step.show_to_client ? 'Hide from client' : 'Show to client'}
                                    >
                                      {step.show_to_client ? (
                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm({ type: 'step', id: step.id })}
                                      className="p-1 hover:bg-destructive/10 rounded"
                                    >
                                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Phase Button */}
                {isEditing && (
                  <button
                    onClick={handleAddPhase}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Phase</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-background flex-shrink-0 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {currentStep?.name || 'Select a step'}
                </h3>
                {isAdmin && (
                  <Button
                    variant={isPreviewMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
                  </Button>
                )}
              </div>

              {/* Scrollable Content */}
              <div 
                ref={contentAreaRef} 
                className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-w-3xl text-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  {renderStepContent()}
                </div>
              </div>

              {/* Footer */}
              {!isEditing && (
                <div className="px-6 py-4 border-t bg-muted/20 flex-shrink-0 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    disabled={currentPhaseIndex === 0 && currentStepIndex === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={saving}
                    className={cn(
                      "gap-1",
                      isCurrentStepCompleted
                        ? "bg-gray-500 hover:bg-gray-600"
                        : "bg-green-500 hover:bg-green-600"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isCurrentStepCompleted ? 'Undone' : 'Done'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        isOpen={slashMenuOpen}
        onClose={() => {
          setSlashMenuOpen(false);
          setSlashFilter('');
        }}
        onSelect={handleAddBlock}
        position={slashMenuPosition}
        filter={slashFilter}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === 'phase' ? 'Phase' : 'Step'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'phase' 
                ? 'This will delete the phase and all its steps. This action cannot be undone.'
                : 'This will delete the step. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'phase') {
                  handleDeletePhase(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'step') {
                  handleDeleteStep(deleteConfirm.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientPortalGuide;
