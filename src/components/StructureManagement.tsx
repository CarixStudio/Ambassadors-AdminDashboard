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
  
  const [selectedDeptId, setSelectedDeptId] = React.useState<string | null>(null);

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
      department_id: formData.get('department_id'),
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Organization Structure</h1>
          <p className="text-muted-foreground font-medium">Manage departments, positions, and ministries across the church.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-2xl border-none h-12">
          <TabsTrigger value="departments" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Building2 className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Briefcase className="w-4 h-4 mr-2" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="ministries" className="rounded-xl px-8 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Heart className="w-4 h-4 mr-2" />
            Ministries
          </TabsTrigger>
        </TabsList>

        {/* DEPARTMENTS */}
        <TabsContent value="departments" className="space-y-4 outline-none">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingDept(null); setIsDeptDialogOpen(true); }} className="shadow-lg shadow-primary/20 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] h-10 px-6">
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <Card key={dept.id} className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onTabChange?.("departments"); }} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingDept(dept); setIsDeptDialogOpen(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('church_departments', dept.id)} className="rounded-xl hover:bg-rose-500/10 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl font-black">{dept.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] font-medium text-xs">
                    {dept.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="flex items-center justify-between">
                    <Badge variant={dept.is_active ? "default" : "secondary"} className="rounded-lg text-[9px] font-black uppercase tracking-widest px-3">
                      {dept.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {positions.filter(p => p.department_id === dept.id).length} Positions
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* POSITIONS */}
        <TabsContent value="positions" className="space-y-4 outline-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedDeptId(null)}
                className={cn("rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 px-4 border-none", !selectedDeptId ? "bg-primary text-white" : "bg-muted/50")}
              >
                All Departments
              </Button>
              {departments.map(d => (
                <Button 
                  key={d.id}
                  variant="outline"
                  onClick={() => setSelectedDeptId(d.id)}
                  className={cn("rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 px-4 border-none", selectedDeptId === d.id ? "bg-primary text-white" : "bg-muted/50")}
                >
                  {d.name}
                </Button>
              ))}
            </div>
            <Button onClick={() => { setEditingPos(null); setIsPosDialogOpen(true); }} className="shadow-lg shadow-primary/20 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] h-10 px-6">
              <Plus className="w-4 h-4" /> Add Position
            </Button>
          </div>

          <Card className="border-none shadow-xl bg-card/50 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-8 py-4 bg-muted/20">
                  {["Title", "Department", "Leadership", "Status", "Actions"].map(h => (
                    <p key={h} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</p>
                  ))}
                </div>
                {positions
                  .filter(p => !selectedDeptId || p.department_id === selectedDeptId)
                  .map((pos) => (
                    <div key={pos.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-8 py-4 items-center hover:bg-muted/10 transition-colors">
                      <div>
                        <p className="font-bold text-sm">{pos.title}</p>
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase">
                          {pos.church_departments?.name || "Global"}
                        </Badge>
                      </div>
                      <div>
                        {pos.is_leadership ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-black uppercase">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] font-black uppercase">No</Badge>
                        )}
                      </div>
                      <div>
                        <Badge variant={pos.is_active ? "default" : "secondary"} className="text-[9px] font-black uppercase">
                          {pos.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPos(pos); setIsPosDialogOpen(true); }} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('church_positions', pos.id)} className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MINISTRIES */}
        <TabsContent value="ministries" className="space-y-4 outline-none">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingMin(null); setIsMinDialogOpen(true); }} className="shadow-lg shadow-primary/20 rounded-xl gap-2 font-black uppercase tracking-widest text-[10px] h-10 px-6">
              <Plus className="w-4 h-4" /> Add Ministry
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ministries.map((min) => (
              <Card key={min.id} className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onTabChange?.("ministries"); }} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingMin(min); setIsMinDialogOpen(true); }} className="rounded-xl hover:bg-primary/10 hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('ministries', min.id)} className="rounded-xl hover:bg-rose-500/10 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl font-black">{min.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] font-medium text-xs">
                    {min.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <Badge variant={min.is_active ? "default" : "secondary"} className="rounded-lg text-[9px] font-black uppercase tracking-widest px-3">
                    {min.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
                <DialogTitle className="text-2xl font-black tracking-tight">{editingPos ? 'Edit' : 'Add'} Position</DialogTitle>
                <DialogDescription className="font-medium">Define a specific role within a department.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Position Title</label>
                  <Input name="title" defaultValue={editingPos?.title} required placeholder="e.g. Unit Member" className="h-12 rounded-xl bg-muted/30 border-none px-4" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assign to Department</label>
                  <select name="department_id" defaultValue={editingPos?.department_id} required className="w-full h-12 rounded-xl bg-muted/30 border-none px-4 text-sm font-medium outline-none">
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
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
              <Button type="submit" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-primary/20">Save Position</Button>
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
