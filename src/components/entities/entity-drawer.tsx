'use client';

import { Company, ReviewStatus } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"; // Need Sheet
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Need Label
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Need Textarea
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Need Select
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateEntity } from "@/actions/entity-actions";

interface EntityDrawerProps {
    entity: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function EntityDrawer({ entity, open, onOpenChange, onSaved }: EntityDrawerProps) {
    const [formData, setFormData] = useState<Partial<Company>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (entity) {
            setFormData({ ...entity });
        }
    }, [entity]);

    const handleSave = async (status?: ReviewStatus) => {
        if (!entity || !formData) return;

        setLoading(true);
        try {
            const updated = {
                ...entity,
                ...formData,
                review_status: status || formData.review_status || entity.review_status,
                reviewed_at: new Date().toISOString() // Assuming string for now based on types
            } as Company;

            const result = await updateEntity(updated);
            if (result.success) {
                toast.success(`Entity ${status ? 'marked as ' + status : 'saved'}`);
                onSaved();
                onOpenChange(false);
            } else {
                toast.error("Failed to save");
            }
        } catch (error) {
            toast.error("Error saving entity");
        } finally {
            setLoading(false);
        }
    };

    if (!entity) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Review Entity</SheetTitle>
                    <SheetDescription>
                        {entity.id}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.entity_name_display || ''}
                            onChange={(e) => setFormData({ ...formData, entity_name_display: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="aliases" className="text-right">
                            Aliases
                        </Label>
                        <Input
                            id="aliases"
                            value={formData.entity_aliases?.join(', ') || ''}
                            onChange={(e) => setFormData({ ...formData, entity_aliases: e.target.value.split(',').map(s => s.trim()) })}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Status</Label>
                        <Select
                            value={formData.review_status}
                            onValueChange={(val) => setFormData({ ...formData, review_status: val as ReviewStatus })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                                <SelectItem value="GOLDENSET_CONFIRMED">Golden Set</SelectItem>
                                <SelectItem value="HUMAN_CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right pt-2">
                            Notes
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.review_notes || ''}
                            onChange={(e) => setFormData({ ...formData, review_notes: e.target.value })}
                            className="col-span-3"
                            placeholder="Internal notes..."
                        />
                    </div>

                    <div className="border-t my-4 pt-4">
                        <h4 className="font-medium mb-3 text-sm">Evidence (Articles)</h4>
                        <div className="space-y-3">
                            {entity.source_articles?.map((article, i) => (
                                <div key={i} className="p-3 bg-slate-50 border rounded-lg space-y-2">
                                    {article.title && (
                                        <div className="font-semibold text-sm leading-snug line-clamp-2">
                                            {article.title}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-muted-foreground font-medium">
                                            {article.publication_date ? new Date(article.publication_date).toLocaleDateString() : 'Date Unknown'}
                                        </span>
                                        {article.source_url && (
                                            <a
                                                href={article.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline font-bold"
                                            >
                                                VIEW SOURCE
                                            </a>
                                        )}
                                    </div>
                                    {!article.title && <div className="text-[10px] text-muted-foreground break-all">ID: {article.article_id}</div>}
                                </div>
                            ))}
                            {(!entity.source_articles || entity.source_articles.length === 0) && (
                                <div className="text-muted-foreground italic text-sm">No linked articles</div>
                            )}
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-col gap-2 sm:flex-col items-stretch">
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="outline" onClick={() => handleSave('REJECTED')} disabled={loading} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            Reject
                        </Button>
                        <Button onClick={() => handleSave('HUMAN_CONFIRMED')} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            Confirm
                        </Button>
                    </div>
                    <Button variant="secondary" onClick={() => handleSave()} disabled={loading} className="w-full">
                        Save Changes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
