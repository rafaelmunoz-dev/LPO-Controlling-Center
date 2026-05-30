import { useAppStore, USERS } from "@/hooks/use-app-context";
import { useTranslation } from "react-i18next";
import { 
  Bell, 
  Search, 
  Download, 
  FilePlus2, 
  Globe, 
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { toast } from "sonner";

export function Topbar() {
  const { selectedEntity, setEntity, setLanguage, currentUser, setCurrentUser } = useAppStore();
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();

  const changeLanguage = (lang: "de" | "en" | "es") => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <header className="h-16 border-b border-sidebar-border bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-primary">LPO GROUP</span>
          <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold">Controlling Center</span>
        </div>

        <div className="w-px h-8 bg-border mx-2"></div>

        <Select value={selectedEntity} onValueChange={(val: any) => setEntity(val)}>
          <SelectTrigger className="w-[200px] border-none shadow-none bg-secondary/10 text-primary font-medium focus:ring-0">
            <SelectValue placeholder="Select Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MiGu Group Gesamt">MiGu Group Gesamt</SelectItem>
            <SelectItem value="IMP">IMP</SelectItem>
            <SelectItem value="C&A">C&A</SelectItem>
            <SelectItem value="MKT">MKT</SelectItem>
            <SelectItem value="CPE">CPE</SelectItem>
            <SelectItem value="COSM">COSM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("search_placeholder")} 
            className="pl-9 bg-muted/50 border-transparent focus-visible:ring-primary/20 rounded-full h-9" 
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {currentUser?.tasks?.map((task, i) => (
              <DropdownMenuItem key={i} onClick={() => navigate("/freigaben")} className="flex-col items-start gap-0.5 py-2">
                <span className="text-sm">{task}</span>
                <span className="text-[0.65rem] text-muted-foreground">{currentUser.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('de')}>Deutsch</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('es')}>Español</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1"></div>

        <Button variant="outline" size="sm" className="hidden lg:flex gap-2" onClick={() => { navigate("/reports"); toast.success(t("export_started")); }}>
          <Download className="h-4 w-4" />
          {t("export")}
        </Button>
        
        <Button size="sm" className="hidden lg:flex gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" onClick={() => navigate("/reports")}>
          <FilePlus2 className="h-4 w-4" />
          {t("bericht_erstellen")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 ml-2 rounded-full hover:bg-muted/50">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-sm font-medium leading-none">{currentUser?.name}</span>
                <span className="text-xs text-muted-foreground leading-none mt-1">{currentUser?.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Switch User</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {USERS.map(user => (
              <DropdownMenuItem 
                key={user.id} 
                onClick={() => setCurrentUser(user)}
                className={currentUser?.id === user.id ? "bg-primary/10" : ""}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{user.name}</span>
                    <span className="text-[0.65rem] text-muted-foreground">{user.role}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
