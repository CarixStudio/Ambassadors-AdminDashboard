import * as React from "react";
import { 
  Building2, 
  Users, 
  Settings, 
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Activity,
  Briefcase,
  ChevronRight,
  Shield,
  Layers,
  Heart,
  Save,
  X,
  Trash
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { auditRepo } from "@/src/lib/audit";
import { useAuth } from "@/src/contexts/AuthContext";

export default function StructureManagement({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = React.useState("departments");
  const [loading, setLoading] = React.useState(true);
  
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [ministries, setMinistries] = React.useState<any[]>([]);
  const [positions, setPositions] = React.useState<any[]>([]);
  
  const [isDeptDialogOpen, setIsDeptDialogOpen] = React.useState(false);
  const [isPosDialogOpen, setIsPosDialogOpen] = React.useState(false);
  const [isMinDialogOpen, setIsMinDialogOpen] = React.useState(false);
  
  const [editingDept, setEditingDept] = React.useState<any>(null);
  const [editingPos, setEditingPos] = React.useState<any>(null);
  const [editingMin, setEditingMin] = React.useState<any>(null);
  
  const [selectedEntity, setSelectedEntity] = React.useState<any>(null);
  const [entityType, setEntityType] = React.useState<'department' | 'ministry' | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: depts },
        { data: mins },
        { data: poss }
      ] = await Promise.all([
        supabase.from('church_departments').select('*').order('name'),
        supabase.from('ministries').select('*').order('name'),
        supabase.from('church_positions').select('*, church_departments(name)').order('title')
      ]);
      
      setDepartments(depts || []);
      setMinistries(mins || []);
      setPositions(poss || []);

      // Refresh selected entity if open
      if (selectedEntity) {
        const refreshed = entityType === 'department' 
          ? depts?.find((d: any) => d.id === selectedEntity.id)
          : mins?.find((m: any) => m.id === selectedEntity.id);
        if (refreshed) setSelectedEntity(refreshed);
      }
    } catch (err: any) {
      toast.error("Failed to load organization structure");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'on'
    };

    try {
      let error;
      if (editingDept) {
        ({ error } = await supabase.from('church_departments').update(data).eq('id', editingDept.id));
      } else {
        ({ error } = await supabase.from('church_departments').insert([data]));
      }
      if (error) throw error;
      toast.success(`Department ${editingDept ? 'updated' : 'created'} successfully`);
      setIsDeptDialogOpen(false);
      setEditingDept(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get('title'),
      department_id: formData.get('department_id') || selectedEntity?.id,
      is_leadership: formData.get('is_leadership') === 'on',
      is_active: formData.get('is_active') === 'on'
    };

    try {
      let error;
      if (editingPos) {
        ({ error } = await supabase.from('church_positions').update(data).eq('id', editingPos.id));
      } else {
        ({ error } = await supabase.from('church_positions').insert([data]));
      }
      if (error) throw error;
      toast.success(`Position ${editingPos ? 'updated' : 'created'} successfully`);
      setIsPosDialogOpen(false);
      setEditingPos(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveMin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'on'
    };

    try {
      let error;
      if (editingMin) {
        ({ error } = await supabase.from('ministries').update(data).eq('id', editingMin.id));
      } else {
        ({ error } = await supabase.from('ministries').insert([data]));
      }
      if (error) throw error;
      toast.success(`Ministry ${editingMin ? 'updated' : 'created'} successfully`);
      setIsMinDialogOpen(false);
      setEditingMin(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure? This may affect existing workers/members.")) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast.success("Deleted successfully");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Structure & Roles</h1>
          </div>
          <p className="text-muted-foreground font-medium">Manage departments, positions, and spiritual ministries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDE: SELECTION LIST */}
        <div className={cn(
          "transition-all duration-500 space-y-6",
          selectedEntity ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedEntity(null); }} className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-2xl border-none h-12 w-full justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger value="departments" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Building2 className="w-4 h-4 mr-2" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="ministries" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Heart className="w-4 h-4 mr-2" />
                Ministries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="space-y-4 outline-none">
              <div className="flex justify-end">
                <Button onClick={() => { setEditingDept(null); setIsDeptDialogOpen(true); }} className="shadow-lg shadow-primary/20 rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] h-9 px-5">
                  <Plus className="w-3.5 h-3.5" /> Add New
                </Button>
              </div>

              <div className={cn(
                "grid gap-4",
                selectedEntity ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {departments.map((dept) => (
                  <Card 
                    key={dept.id} 
                    onClick={() => { setSelectedEntity(dept); setEntityType('department'); }}
                    className={cn(
                      "border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer border-2",
                      selectedEntity?.id === dept.id ? "border-primary/40 ring-2 ring-primary/10 shadow-xl" : "border-transparent"
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className={cn(
                          "p-3 rounded-2xl transition-colors",
                          selectedEntity?.id === dept.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingDept(dept); setIsDeptDialogOpen(true); }} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete('church_departments', dept.id); }} className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="mt-4 text-lg font-black">{dept.name}</CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[32px] font-medium text-[11px]">
                        {dept.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="flex items-center justify-between">
                        <Badge variant={dept.is_active ? "default" : "secondary"} className="rounded-lg text-[8px] font-black uppercase tracking-widest px-2.5 h-5">
                          {dept.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          {positions.filter(p => p.department_id === dept.id).length} Roles <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ministries" className="space-y-4 outline-none">
              <div className="flex justify-end">
                <Button onClick={() => { setEditingMin(null); setIsMinDialogOpen(true); }} className="shadow-lg shadow-primary/20 rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] h-9 px-5">
                  <Plus className="w-3.5 h-3.5" /> Add New
                </Button>
              </div>

              <div className={cn(
                "grid gap-4",
                selectedEntity ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {ministries.map((min) => (
                  <Card 
                    key={min.id} 
                    onClick={() => { setSelectedEntity(min); setEntityType('ministry'); }}
                    className={cn(
                      "border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer border-2",
                      selectedEntity?.id === min.id ? "border-primary/40 ring-2 ring-primary/10 shadow-xl" : "border-transparent"
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className={cn(
                          "p-3 rounded-2xl transition-colors",
                          selectedEntity?.id === min.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}>
                          <Heart className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingMin(min); setIsMinDialogOpen(true); }} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete('ministries', min.id); }} className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="mt-4 text-lg font-black">{min.name}</CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[32px] font-medium text-[11px]">
                        {min.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <Badge variant={min.is_active ? "default" : "secondary"} className="rounded-lg text-[8px] font-black uppercase tracking-widest px-2.5 h-5">
                        {min.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT SIDE: DETAIL PANEL (ROLES MANAGER) */}
        <AnimatePresence mode="wait">
          {selectedEntity && (
            <motion.div 
              key={selectedEntity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-8 space-y-6"
            >
              <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden sticky top-8">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-primary rounded-3xl text-white shadow-xl shadow-primary/20">
                        {entityType === 'department' ? <Building2 className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black tracking-tight">{selectedEntity.name}</h2>
                          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                            {entityType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mt-1">{selectedEntity.description}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedEntity(null)} className="rounded-2xl h-12 w-12 hover:bg-muted/50">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-8 pt-4">
                  {entityType === 'department' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Department Roles</h3>
                          <p className="text-[11px] text-muted-foreground font-medium mt-1">Define specific positions available within this unit.</p>
                        </div>
                        <Button 
                          onClick={() => { setEditingPos(null); setIsPosDialogOpen(true); }}
                          className="rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 h-10 px-6 gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Plus className="w-4 h-4" /> Add Role
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        {positions.filter(p => p.department_id === selectedEntity.id).length === 0 ? (
                          <div className="py-12 text-center border-2 border-dashed border-muted rounded-3xl bg-muted/5">
                            <Briefcase className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm font-bold text-muted-foreground">No roles defined yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Add roles to start assigning members to this department.</p>
                          </div>
                        ) : (
                          positions
                            .filter(p => p.department_id === selectedEntity.id)
                            .map((pos) => (
                              <div key={pos.id} className="flex items-center justify-between p-4 rounded-3xl bg-background/40 border border-primary/5 hover:border-primary/20 hover:bg-background/60 transition-all group">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                                    pos.is_leadership ? "bg-amber-500/10 text-amber-600" : "bg-primary/5 text-primary"
                                  )}>
                                    {pos.is_leadership ? <Shield className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm">{pos.title}</p>
                                      {pos.is_leadership && <Badge className="bg-amber-500/10 text-amber-600 border-none text-[8px] font-black uppercase px-2 h-4">Leadership</Badge>}
                                    </div>
                                    <Badge variant={pos.is_active ? "default" : "secondary"} className="text-[8px] font-black uppercase h-4 px-1.5 mt-1 border-none">
                                      {pos.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => { setEditingPos(pos); setIsPosDialogOpen(true); }} className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete('church_positions', pos.id)} className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-8 text-center border-2 border-dashed border-muted rounded-[2rem] bg-muted/5">
                        <Heart className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                        <h3 className="text-lg font-black tracking-tight text-muted-foreground">Ministry Configuration</h3>
                        <p className="text-sm text-muted-foreground/60 mt-2 max-w-sm mx-auto">
                          Ministries currently use universal church roles. In the future, you will be able to define custom spiritual leadership tiers here.
                        </p>
                        <Button variant="outline" className="mt-6 rounded-2xl font-bold uppercase text-[10px] tracking-widest px-8 border-none bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => onTabChange?.("ministries")}>
                          View Ministry Members
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-8 pt-0 flex justify-between items-center bg-muted/10 border-t border-border/50">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Activity className="w-3.5 h-3.5" /> Last synced: {new Date().toLocaleTimeString()}
                  </div>
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary" onClick={() => fetchData()}>
                    Refresh Data
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DIALOGS */}
      
      {/* Dept Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-0 overflow-hidden bg-background max-w-md shadow-2xl">
          <form onSubmit={handleSaveDept}>
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">{editingDept ? 'Edit' : 'Add'} Department</DialogTitle>
                <DialogDescription className="font-medium">Define an outreach or operational unit.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department Name</label>
                  <Input name="name" defaultValue={editingDept?.name} required placeholder="e.g. Community Support" className="h-12 rounded-xl bg-muted/30 border-none px-4" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                  <Input name="description" defaultValue={editingDept?.description} placeholder="Short description..." className="h-12 rounded-xl bg-muted/30 border-none px-4" />
                </div>
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" name="is_active" defaultChecked={editingDept ? editingDept.is_active : true} className="w-4 h-4 accent-primary" />
                  <label className="text-xs font-bold">Active Status</label>
                </div>
              </div>
            </div>
            
            <DialogFooter className="bg-muted/20 p-6 flex gap-3 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsDeptDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
              <Button type="submit" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">Save Department</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Position Dialog */}
      <Dialog open={isPosDialogOpen} onOpenChange={setIsPosDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-0 overflow-hidden bg-background max-w-md shadow-2xl">
          <form onSubmit={handleSavePos}>
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">{editingPos ? 'Edit' : 'Add'} Role</DialogTitle>
                <DialogDescription className="font-medium">Define a specific position for {selectedEntity?.name || 'Department'}.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Role Title</label>
                  <Input name="title" defaultValue={editingPos?.title} required placeholder="e.g. Team Lead" className="h-12 rounded-xl bg-muted/30 border-none px-4" />
                </div>
                {!selectedEntity && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assign to Department</label>
                    <select name="department_id" defaultValue={editingPos?.department_id} required className="w-full h-12 rounded-xl bg-muted/30 border-none px-4 text-sm font-medium outline-none">
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-6 px-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="is_leadership" defaultChecked={editingPos?.is_leadership} className="w-4 h-4 accent-amber-500" />
                    <label className="text-xs font-bold text-amber-600">Leadership Role</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="is_active" defaultChecked={editingPos ? editingPos.is_active : true} className="w-4 h-4 accent-primary" />
                    <label className="text-xs font-bold">Active</label>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="bg-muted/20 p-6 flex gap-3 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsPosDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
              <Button type="submit" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">Save Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ministry Dialog */}
      <Dialog open={isMinDialogOpen} onOpenChange={setIsMinDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-0 overflow-hidden bg-background max-w-md shadow-2xl">
          <form onSubmit={handleSaveMin}>
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">{editingMin ? 'Edit' : 'Add'} Ministry</DialogTitle>
                <DialogDescription className="font-medium">Define a spiritual fellowship group.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ministry Name</label>
                  <Input name="name" defaultValue={editingMin?.name} required placeholder="e.g. Youth Fellowship" className="h-12 rounded-xl bg-muted/30 border-none px-4" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                  <Input name="description" defaultValue={editingMin?.description} placeholder="Short description..." className="h-12 rounded-xl bg-muted/30 border-none px-4" />
                </div>
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" name="is_active" defaultChecked={editingMin ? editingMin.is_active : true} className="w-4 h-4 accent-primary" />
                  <label className="text-xs font-bold">Active Status</label>
                </div>
              </div>
            </div>
            
            <DialogFooter className="bg-muted/20 p-6 flex gap-3 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsMinDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
              <Button type="submit" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">Save Ministry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
