import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, User, LogOut, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { GlobalSearch } from "./GlobalSearch";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Notif = {
  id: string;
  ot_id: string | null;
  tipo_evento: string;
  asunto: string | null;
  contenido: string | null;
  created_at: string;
};

const READ_KEY = "notif_last_read_at";

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string>(() => localStorage.getItem(READ_KEY) || "1970-01-01T00:00:00Z");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notificaciones_log")
      .select("id, ot_id, tipo_evento, asunto, contenido, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifs((data as Notif[]) || []);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || "");
    });
    load();
    const channel = supabase
      .channel("header-notif")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificaciones_log" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const unread = notifs.filter((n) => new Date(n.created_at) > new Date(lastReadAt)).length;

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v && notifs.length > 0) {
      const newest = notifs[0].created_at;
      localStorage.setItem(READ_KEY, newest);
      setLastReadAt(newest);
    }
  };

  const handleClickNotif = (n: Notif) => {
    setOpen(false);
    if (n.ot_id) navigate(`/ordenes-servicio/${n.ot_id}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente" });
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <GlobalSearch />
        </div>

        <div className="flex items-center space-x-4">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" aria-label="Notificaciones">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unread > 9 ? "9+" : unread}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="font-semibold">Notificaciones</p>
                <span className="text-xs text-muted-foreground">{notifs.length} recientes</span>
              </div>
              <ScrollArea className="max-h-96">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Inbox className="w-8 h-8 mb-2" />
                    <p className="text-sm">Sin notificaciones</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {notifs.map((n) => {
                      const isUnread = new Date(n.created_at) > new Date(lastReadAt);
                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => handleClickNotif(n)}
                            className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors flex gap-3 items-start"
                          >
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? "bg-primary" : "bg-transparent"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {n.asunto || n.tipo_evento}
                              </p>
                              {n.contenido && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.contenido}</p>
                              )}
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{userEmail.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
