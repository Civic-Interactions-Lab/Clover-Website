import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ConsentFormPreview from "@/pages/auth/ui/components/ConsentFormPreview";
import { ConsentForm, ConsentFormBlock } from "@/api/consent";
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
} from "lucide-react";

// Debounce hook
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CreateEditConsentView = () => {
  const [consentForm, setConsentForm] = useState<ConsentForm | null>(null);
  const [blocks, setBlocks] = useState<ConsentFormBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(
    new Map()
  );

  // Debounce pending updates
  const debouncedUpdates = useDebounce(pendingUpdates, 500) as Map<string, any>;

  // Convert database format to frontend format
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
    subtitle: dbForm.subtitle,
    studyTitle: dbForm.study_title,
    researchLead: dbForm.research_lead,
    institution: dbForm.institution,
    irbNumber: dbForm.irb_number,
    createdAt: dbForm.created_at,
    updatedAt: dbForm.updated_at,
    blocks: (dbForm.blocks || []).map(dbBlockToFrontend),
  });

  // Process debounced updates
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
          toast.error("Failed to save changes");
        }
      }
    };

    processUpdates();
  }, [debouncedUpdates]);

  // Load consent form and blocks
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
        toast.error("Failed to load consent form");
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
          toast.error("Failed to load blocks");
          return;
        }

        setBlocks((blocksData || []).map(dbBlockToFrontend));
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load consent form");
    } finally {
      setLoading(false);
    }
  };

  // Update form metadata (immediate update for form fields)
  const updateFormField = async (field: string, value: any) => {
    if (!consentForm) return;

    // Update local state immediately
    setConsentForm((prev) => (prev ? { ...prev, [field]: value } : null));

    try {
      const { error } = await supabase
        .from("consent_forms")
        .update({ [field]: value })
        .eq("id", consentForm.id);

      if (error) throw error;
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      toast.error(`Failed to update ${field}`);
      setConsentForm((prev) =>
        prev
          ? { ...prev, [field]: consentForm[field as keyof ConsentForm] }
          : null
      );
    }
  };

  // Update individual block (with debouncing)
  const updateBlock = useCallback(
    (blockId: string, updates: Partial<ConsentFormBlock>) => {
      // Update local state immediately for responsive UI
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block
        )
      );

      // Add to pending updates for debounced database save
      setPendingUpdates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(blockId) || {};
        newMap.set(blockId, { ...existing, ...updates });
        return newMap;
      });
    },
    []
  );

  // Add new block (immediate update)
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

      toast.success("Block added successfully");
    } catch (err) {
      console.error("Failed to add block:", err);
      toast.error("Failed to add block");
    }
  };

  // Delete block (immediate update)
  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from("consent_form_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      setBlocks((prev) => prev.filter((block) => block.id !== blockId));
      toast.success("Block deleted successfully");
    } catch (err) {
      console.error("Failed to delete block:", err);
      toast.error("Failed to delete block");
    }
  };

  // Real-time subscriptions
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
          <p>Loading consent form...</p>
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
          <div className="space-y-6">
            {/* Form metadata editor */}
            <div className="border p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Form Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title
                  </label>
                  <Input
                    type="text"
                    value={consentForm?.title || ""}
                    onChange={(e) => updateFormField("title", e.target.value)}
                    placeholder="Consent form title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subtitle
                  </label>
                  <Input
                    type="text"
                    value={consentForm?.subtitle || ""}
                    onChange={(e) =>
                      updateFormField("subtitle", e.target.value)
                    }
                    placeholder="Consent form subtitle"
                  />
                </div>
                {/* Research info fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Study Title
                    </label>
                    <Input
                      type="text"
                      value={consentForm?.studyTitle || ""}
                      onChange={(e) =>
                        updateFormField("study_title", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Principal Investigator
                    </label>
                    <Input
                      type="text"
                      value={consentForm?.researchLead || ""}
                      onChange={(e) =>
                        updateFormField("research_lead", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Institution
                    </label>
                    <Input
                      type="text"
                      value={consentForm?.institution || ""}
                      onChange={(e) =>
                        updateFormField("institution", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      IRB Protocol
                    </label>
                    <Input
                      type="text"
                      value={consentForm?.irbNumber || ""}
                      onChange={(e) =>
                        updateFormField("irb_number", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Blocks editor */}
            <div className="space-y-4">
              {blocks.map((block) => (
                <div key={block.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">No. {block.sortOrder}</span>
                      <span className="mb-1">|</span>
                      <span className="text-xs">
                        {block.type.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          editingBlock === block.id ? "outline" : "default"
                        }
                        onClick={() =>
                          setEditingBlock(
                            editingBlock === block.id ? null : block.id
                          )
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

                      {(block.type === "list" ||
                        block.type === "info_box_list") && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            List Items
                          </label>
                          <div className="space-y-2">
                            {Array.isArray(block.content.items) &&
                            block.content.items.length > 0 ? (
                              block.content.items.map(
                                (item: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex gap-2 items-center"
                                  >
                                    <Input
                                      value={item}
                                      onChange={(e) => {
                                        const newItems = [
                                          ...block.content.items,
                                        ];
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
                                        const newItems =
                                          block.content.items.filter(
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
                                )
                              )
                            ) : (
                              <div className="text-sm text-gray-500">
                                No items
                              </div>
                            )}

                            {/* Add new item button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const currentItems = Array.isArray(
                                  block.content.items
                                )
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
              ))}
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

          {/* Right Side - Preview */}
          <div className="border rounded-lg sticky top-8">
            <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
              <h2 className="text-xl font-semibold">Live Preview</h2>
            </div>
            <div className="p-6 max-h-screen overflow-y-auto">
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
