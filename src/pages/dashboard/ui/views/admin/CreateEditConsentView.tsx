import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ConsentFormPreview from "@/pages/auth/ui/components/ConsentFormPreview";
import {
  CheckSquare,
  Columns,
  Edit,
  FileText,
  Heading,
  Info,
  List,
  Plus,
  Trash2,
  X,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConsentForm, ConsentFormBlock } from "@/types/consent";
import { useDebounce } from "@/hooks/useDebounce";
import { Label } from "@/components/ui/label";

// Sortable Block Item Component
interface SortableBlockItemProps {
  block: ConsentFormBlock;
  editingBlock: string | null;
  setEditingBlock: (id: string | null) => void;
  updateBlock: (blockId: string, updates: Partial<ConsentFormBlock>) => void;
  deleteBlock: (blockId: string) => void;
}

const SortableBlockItem = ({
  block,
  editingBlock,
  setEditingBlock,
  updateBlock,
  deleteBlock,
}: SortableBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border p-4 rounded-lg ${isDragging ? "shadow-lg z-10" : ""}`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical size={16} className="text-gray-400" />
          </div>
          <span className="text-sm">No. {block.sortOrder}</span>
          <span className="mb-1">|</span>
          <span className="text-xs">
            {block.type.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={editingBlock === block.id ? "outline" : "default"}
            onClick={() =>
              setEditingBlock(editingBlock === block.id ? null : block.id)
            }
          >
            {editingBlock === block.id ? (
              <span className="flex items-center gap-1.5">
                <X /> Close
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Edit /> Edit
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteBlock(block.id)}
            className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-700/70 border-red-200 hover:border-red-300"
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      {/* Block content editor */}
      {editingBlock === block.id && (
        <div className="space-y-3 border-t pt-3">
          {(block.type === "paragraph" ||
            block.type === "section_header" ||
            block.type === "info_box") && (
            <Textarea
              value={block.content.text || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  content: {
                    ...block.content,
                    text: e.target.value,
                  },
                })
              }
              rows={3}
              placeholder={`Enter ${block.type.replace("_", " ")} content...`}
            />
          )}

          {(block.type === "list" || block.type === "info_box_list") && (
            <div>
              <label className="block text-sm font-medium mb-2">
                List Items
              </label>
              <div className="space-y-2">
                {Array.isArray(block.content.items) &&
                block.content.items.length > 0 ? (
                  block.content.items.map((item: string, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newItems = [...block.content.items];
                          newItems[index] = e.target.value;
                          updateBlock(block.id, {
                            content: {
                              ...block.content,
                              items: newItems,
                            },
                          });
                        }}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newItems = block.content.items.filter(
                            (_: any, i: number) => i !== index
                          );
                          updateBlock(block.id, {
                            content: {
                              ...block.content,
                              items: newItems,
                            },
                          });
                        }}
                        className="px-2"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No items</div>
                )}

                {/* Add new item button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentItems = Array.isArray(block.content.items)
                      ? block.content.items
                      : [];
                    updateBlock(block.id, {
                      content: {
                        ...block.content,
                        items: [...currentItems, "New item"],
                      },
                    });
                  }}
                  className="w-full mt-2"
                >
                  <Plus size={16} className="mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          )}

          {block.type === "two_column_info" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Left Title
                </label>
                <Input
                  type="text"
                  value={block.content.left?.title || ""}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      content: {
                        ...block.content,
                        left: {
                          ...block.content.left,
                          title: e.target.value,
                        },
                      },
                    })
                  }
                />
                <label className="block text-sm font-medium mb-2 mt-2">
                  Left Content
                </label>
                <Textarea
                  value={block.content.left?.content || ""}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      content: {
                        ...block.content,
                        left: {
                          ...block.content.left,
                          content: e.target.value,
                        },
                      },
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Right Title
                </label>
                <Input
                  type="text"
                  value={block.content.right?.title || ""}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      content: {
                        ...block.content,
                        right: {
                          ...block.content.right,
                          title: e.target.value,
                        },
                      },
                    })
                  }
                />
                <label className="block text-sm font-medium mb-2 mt-2">
                  Right Content
                </label>
                <Textarea
                  value={block.content.right?.content || ""}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      content: {
                        ...block.content,
                        right: {
                          ...block.content.right,
                          content: e.target.value,
                        },
                      },
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CreateEditConsentView = () => {
  const [consentForm, setConsentForm] = useState<ConsentForm | null>(null);
  const [blocks, setBlocks] = useState<ConsentFormBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(
    new Map()
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const debouncedUpdates = useDebounce(pendingUpdates, 500) as Map<string, any>;

  const dbBlockToFrontend = (dbBlock: any): ConsentFormBlock => ({
    id: dbBlock.id,
    formId: dbBlock.form_id,
    type: dbBlock.type,
    content: dbBlock.content,
    sortOrder: dbBlock.sort_order,
    createdAt: dbBlock.created_at,
    updatedAt: dbBlock.updated_at,
  });

  const dbFormToFrontend = (dbForm: any): ConsentForm => ({
    id: dbForm.id,
    title: dbForm.title,
    principalInvestigator: dbForm.principal_investigator,
    institution: dbForm.institution,
    irbProtocol: dbForm.irb_protocol,
    email: dbForm.email,
    phone: dbForm.phone,
    faculty: dbForm.faculty,
    createdAt: dbForm.created_at,
    updatedAt: dbForm.updated_at,
    blocks: (dbForm.blocks || []).map(dbBlockToFrontend),
  });

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);

      const updatedBlocks = reorderedBlocks.map((block, index) => ({
        ...block,
        sortOrder: index + 1,
      }));

      setBlocks(updatedBlocks);

      // Update sort orders in database
      try {
        const updates = updatedBlocks.map((block, index) => ({
          id: block.id,
          sort_order: index + 1,
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from("consent_form_blocks")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id);

          if (error) throw error;
        }
      } catch (err) {
        console.error("Failed to update block order:", err);
        loadConsentForm();
      }
    },
    [blocks]
  );

  useEffect(() => {
    const processUpdates = async () => {
      if (debouncedUpdates.size === 0) return;

      const updates = Array.from(debouncedUpdates.entries());
      setPendingUpdates(new Map()); // Clear pending updates

      for (const [blockId, updateData] of updates) {
        try {
          const dbUpdates: any = {};
          if (updateData.content !== undefined)
            dbUpdates.content = updateData.content;
          if (updateData.sortOrder !== undefined)
            dbUpdates.sort_order = updateData.sortOrder;

          const { error } = await supabase
            .from("consent_form_blocks")
            .update(dbUpdates)
            .eq("id", blockId);

          if (error) throw error;
        } catch (err) {
          console.error("Failed to update block:", err);
        }
      }
    };

    processUpdates();
  }, [debouncedUpdates]);

  const loadConsentForm = async () => {
    setLoading(true);
    try {
      // Load main form
      const { data: formData, error: formError } = await supabase
        .from("consent_forms")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (formError) {
        console.error("Error loading consent form:", formError);
        return;
      }

      if (formData) {
        setConsentForm(dbFormToFrontend(formData));

        // Load blocks for this form
        const { data: blocksData, error: blocksError } = await supabase
          .from("consent_form_blocks")
          .select("*")
          .eq("form_id", formData.id)
          .order("sort_order", { ascending: true });

        if (blocksError) {
          console.error("Error loading blocks:", blocksError);
          return;
        }

        setBlocks((blocksData || []).map(dbBlockToFrontend));
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update form metadata (immediate update for form fields)
  const updateFormField = async (field: string, value: any) => {
    if (!consentForm) return;

    setConsentForm((prev) => (prev ? { ...prev, [field]: value } : null));

    try {
      // Map camelCase to snake_case for database
      const fieldMapping: { [key: string]: string } = {
        studyTitle: "study_title",
        principalInvestigator: "principal_investigator",
        irbProtocol: "irb_protocol",
      };

      const dbField = fieldMapping[field] || field;

      const { error } = await supabase
        .from("consent_forms")
        .update({ [dbField]: value })
        .eq("id", consentForm.id);

      if (error) throw error;
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      setConsentForm((prev) =>
        prev
          ? { ...prev, [field]: consentForm[field as keyof ConsentForm] }
          : null
      );
    }
  };

  const updateBlock = useCallback(
    (blockId: string, updates: Partial<ConsentFormBlock>) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block
        )
      );

      setPendingUpdates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(blockId) || {};
        newMap.set(blockId, { ...existing, ...updates });
        return newMap;
      });
    },
    []
  );

  const addBlock = async (type: string) => {
    if (!consentForm) return;

    const newSortOrder = Math.max(...blocks.map((b) => b.sortOrder), 0) + 1;

    try {
      const { data, error } = await supabase
        .from("consent_form_blocks")
        .insert({
          form_id: consentForm.id,
          type,
          content: getDefaultContent(type),
          sort_order: newSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newBlock = dbBlockToFrontend(data);
      setBlocks((prev) => [...prev, newBlock]);
      setEditingBlock(newBlock.id);
    } catch (err) {
      console.error("Failed to add block:", err);
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from("consent_form_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      setBlocks((prev) => prev.filter((block) => block.id !== blockId));
    } catch (err) {
      console.error("Failed to delete block:", err);
    }
  };

  useEffect(() => {
    loadConsentForm();

    // Subscribe to form changes
    const formChannel = supabase
      .channel("consent-forms-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consent_forms",
        },
        (payload) => {
          console.log("[Realtime] Form changed:", payload);

          if (
            payload.eventType === "UPDATE" &&
            payload.new &&
            typeof payload.new === "object" &&
            "id" in payload.new &&
            payload.new.id === consentForm?.id
          ) {
            setConsentForm(dbFormToFrontend(payload.new));
          }
        }
      )
      .subscribe();

    // Subscribe to block changes
    const blocksChannel = supabase
      .channel("consent-form-blocks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consent_form_blocks",
        },
        (payload) => {
          console.log("[Realtime] Block changed:", payload);

          if (payload.eventType === "INSERT" && payload.new) {
            if (typeof payload.new === "object" && "form_id" in payload.new) {
              const newBlock = dbBlockToFrontend(payload.new);
              if (newBlock.formId === consentForm?.id) {
                setBlocks((prev) => {
                  // Check if block already exists to prevent duplicates
                  if (prev.find((b) => b.id === newBlock.id)) return prev;
                  return [...prev, newBlock].sort(
                    (a, b) => a.sortOrder - b.sortOrder
                  );
                });
              }
            }
          }

          if (payload.eventType === "UPDATE" && payload.new) {
            if (typeof payload.new === "object" && "form_id" in payload.new) {
              const updatedBlock = dbBlockToFrontend(payload.new);
              if (updatedBlock.formId === consentForm?.id) {
                setBlocks((prev) =>
                  prev.map((block) =>
                    block.id === updatedBlock.id ? updatedBlock : block
                  )
                );
              }
            }
          }

          if (payload.eventType === "DELETE" && payload.old) {
            if (typeof payload.old === "object" && "id" in payload.old) {
              setBlocks((prev) =>
                prev.filter((block) => block.id !== (payload.old as any).id)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(formChannel);
      supabase.removeChannel(blocksChannel);
    };
  }, [consentForm?.id]);

  // Helper functions for default content
  const getDefaultContent = (type: string) => {
    switch (type) {
      case "section_header":
        return { text: "New Section Header" };
      case "paragraph":
        return { text: "Enter paragraph content here..." };
      case "list":
        return { items: ["List item 1", "List item 2"] };
      case "info_box":
        return { text: "Information box content" };
      case "info_box_list":
        return { items: ["Info item 1", "Info item 2"] };
      case "two_column_info":
        return {
          left: { title: "Left Title", content: "Left content" },
          right: { title: "Right Title", content: "Right content" },
        };
      default:
        return { text: "" };
    }
  };

  const getPreviewData = (): ConsentForm | null => {
    if (!consentForm) return null;

    return {
      ...consentForm,
      blocks: blocks,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const previewData = getPreviewData();

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Editor */}
          <div className="rounded-lg lg:sticky lg:top-8 border">
            <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900 rounded-t-lg">
              <h2 className="text-xl font-semibold">Edit View</h2>
            </div>
            <div className="space-y-6 lg:max-h-screen lg:overflow-y-auto px-4">
              {/* Form metadata editor - Updated to match database schema */}
              <div className="border p-6 rounded-lg mt-6">
                <h2 className="text-xl font-semibold mb-4">Form Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Title
                    </Label>
                    <Input
                      type="text"
                      value={consentForm?.title || ""}
                      onChange={(e) => updateFormField("title", e.target.value)}
                      placeholder="Consent form title"
                    />
                  </div>

                  {/* Research info fields - Updated to match actual DB schema */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Principal Investigator
                      </Label>
                      <Input
                        type="text"
                        value={consentForm?.principalInvestigator || ""}
                        onChange={(e) =>
                          updateFormField(
                            "principalInvestigator",
                            e.target.value
                          )
                        }
                        placeholder="Principal Investigator name"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Institution
                      </Label>
                      <Input
                        type="text"
                        value={consentForm?.institution || ""}
                        onChange={(e) =>
                          updateFormField("institution", e.target.value)
                        }
                        placeholder="Institution name"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        IRB Protocol
                      </Label>
                      <Input
                        type="text"
                        value={consentForm?.irbProtocol || ""}
                        onChange={(e) =>
                          updateFormField("irbProtocol", e.target.value)
                        }
                        placeholder="IRB Protocol number"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Faculty
                      </Label>
                      <Input
                        type="text"
                        value={consentForm?.faculty || ""}
                        onChange={(e) =>
                          updateFormField("faculty", e.target.value)
                        }
                        placeholder="Faculty/Department"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={consentForm?.email || ""}
                        onChange={(e) =>
                          updateFormField("email", e.target.value)
                        }
                        placeholder="Contact email"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Phone
                      </Label>
                      <Input
                        type="tel"
                        value={consentForm?.phone || ""}
                        onChange={(e) =>
                          updateFormField("phone", e.target.value)
                        }
                        placeholder="Contact phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocks editor with drag and drop */}
              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map((block) => block.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        editingBlock={editingBlock}
                        setEditingBlock={setEditingBlock}
                        updateBlock={updateBlock}
                        deleteBlock={deleteBlock}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {blocks.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    No blocks yet. Add some content blocks to get started.
                  </div>
                )}
              </div>

              {/* Add block controls */}
              <div className="border p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Add Content</h3>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      value: "section_header",
                      label: "Section Header",
                      icon: Heading,
                    },
                    { value: "paragraph", label: "Paragraph", icon: FileText },
                    { value: "list", label: "List", icon: List },
                    { value: "info_box", label: "Info Box", icon: Info },
                    {
                      value: "info_box_list",
                      label: "Info Box List",
                      icon: CheckSquare,
                    },
                    {
                      value: "two_column_info",
                      label: "Two Column Info",
                      icon: Columns,
                    },
                  ].map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <Button
                        key={type.value}
                        onClick={() => addBlock(type.value)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <IconComponent size={16} />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="border rounded-lg lg:sticky lg:top-8">
            <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
              <h2 className="text-xl font-semibold">Live Preview</h2>
            </div>
            <div className="p-6 lg:max-h-screen lg:overflow-y-auto">
              {previewData ? (
                <ConsentFormPreview consentFormData={previewData} />
              ) : (
                <p className="text-gray-500">No consent form data to preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEditConsentView;
