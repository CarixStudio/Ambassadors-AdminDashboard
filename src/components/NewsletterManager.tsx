import * as React from "react";
import { 
  Mail, 
  Search, 
  Download, 
  Trash2, 
  UserPlus, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Send,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function NewsletterManager() {
  const [subscribers, setSubscribers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query;
      if (error) throw error;
      setSubscribers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const debounce = setTimeout(fetchSubscribers, 500);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success("Subscriber status updated");
      fetchSubscribers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Subscriber removed");
      fetchSubscribers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const exportCSV = () => {
    const headers = ["Email", "Status", "Subscribed At"];
    const csvContent = [
      headers.join(","),
      ...subscribers.map(s => [s.email, s.is_active ? 'Active' : 'Inactive', new Date(s.created_at).toLocaleDateString()].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "newsletter_subscribers.csv";
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Newsletter Management
          </h1>
          <p className="text-muted-foreground font-medium">Manage your community mailing list and newsletter subscriptions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2 rounded-xl h-11 px-6 border-none bg-card/50 shadow-sm">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
            <Send className="w-4 h-4" /> Send Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Subscribers</p>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black">{subscribers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Growth: +0% this week</p>
        </Card>
        
        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black">{subscribers.filter(s => s.is_active).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Deliverability: 100%</p>
        </Card>

        <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unsubscribed</p>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black">{subscribers.filter(s => !s.is_active).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Churn rate: 0%</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email..." 
            className="pl-10 h-12 rounded-2xl bg-card/50 border-none shadow-sm focus-visible:ring-primary/20 text-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'secondary' : 'ghost'} 
            onClick={() => setStatusFilter('all')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-12 px-6"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'secondary' : 'ghost'} 
            onClick={() => setStatusFilter('active')}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-12 px-6"
          >
            Active
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subscriber Email</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined At</th>
                  <th className="p-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="p-8"><div className="h-4 bg-muted/30 rounded-lg w-full" /></td>
                      </tr>
                    ))
                  ) : subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Mail className="w-12 h-12 text-muted-foreground/20" />
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No subscribers found</p>
                        </div>
                      </td>
                    </tr>
                  ) : subscribers.map((s) => (
                    <motion.tr 
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Mail className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-sm">{s.email}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <Badge 
                          className={cn(
                            "rounded-lg text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-none",
                            s.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                          )}
                        >
                          {s.is_active ? "Subscribed" : "Unsubscribed"}
                        </Badge>
                      </td>
                      <td className="p-5 text-xs text-muted-foreground font-medium">
                        {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatus(s.id, s.is_active)}
                            className={cn("h-8 px-3 rounded-lg text-[10px] font-bold uppercase", s.is_active ? "text-rose-600 hover:text-rose-700 hover:bg-rose-500/5" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5")}
                          >
                            {s.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteSubscriber(s.id)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
