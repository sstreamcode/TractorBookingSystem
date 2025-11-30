import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-800 group-[.toaster]:text-slate-100 group-[.toaster]:border-2 group-[.toaster]:border-amber-500/50 group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-slate-300",
          actionButton: "group-[.toast]:bg-amber-500 group-[.toast]:text-slate-900 group-[.toast]:hover:bg-amber-600",
          cancelButton: "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300 group-[.toast]:hover:bg-slate-600",
          success: "group-[.toaster]:border-emerald-500/50 group-[.toaster]:bg-slate-800",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:bg-slate-800",
          warning: "group-[.toaster]:border-yellow-500/50 group-[.toaster]:bg-slate-800",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:bg-slate-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
