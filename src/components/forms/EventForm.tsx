import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { ImageUpload } from "@/src/components/ui/ImageUpload";

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Description is required"),
  location_name: z.string().min(2, "Location is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  event_type: z.enum(["service", "conference", "retreat", "workshop", "outreach", "fellowship", "youth", "prayer_meeting", "other", "community_impact"]),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled", "postponed"]),
  cover_image_url: z.string().optional(),
  capacity: z.number().min(0).default(0),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
  const [loading, setLoading] = React.useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData ? {
      ...initialData,
      event_type: initialData.event_type || "other",
      status: initialData.status || "upcoming",
      start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : "",
      end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : "",
      capacity: initialData.capacity || 0,
    } : {
      title: "",
      description: "",
      location_name: "",
      start_date: "",
      end_date: "",
      event_type: "other",
      status: "upcoming",
      capacity: 0,
    },
  });

  async function onSubmit(values: EventFormValues) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        event_type: values.event_type as any,
        status: values.status as any,
        slug: values.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { error } = await supabase
          .from("events")
          .insert([payload]);
        if (error) throw error;
        toast.success("Event created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control as any}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Sunday Service, Youth Conference..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us more about the event..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={(field.value as string) || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={(field.value as string) || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as any}
          name="location_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Main Sanctuary, Online, Community Center..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="event_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="retreat">Retreat</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                    <SelectItem value="community_impact">Community Impact</SelectItem>
                    <SelectItem value="fellowship">Fellowship</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="prayer_meeting">Prayer Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control as any}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity (0 for unlimited)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <ImageUpload
                label="Event Cover Image"
                hint="Recommended: 16:9 banner (1200×675). Shown on the events page and event detail."
                value={field.value}
                onChange={field.onChange}
                folder="ambassadors_assembly/events"
                aspectRatio="video"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
