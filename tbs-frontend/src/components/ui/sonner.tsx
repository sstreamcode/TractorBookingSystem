import { Toaster as Sonner, toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  
  return (
    <Sonner
      position="top-right"
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-amber-500/50 group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-amber-500 group-[.toast]:text-white group-[.toast]:hover:bg-amber-600",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          success: "group-[.toaster]:border-emerald-500/50 group-[.toaster]:bg-background",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:bg-background",
          warning: "group-[.toaster]:border-yellow-500/50 group-[.toaster]:bg-background",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:bg-background",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
