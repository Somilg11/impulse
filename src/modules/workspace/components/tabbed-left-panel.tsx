"use client";

import { Hint } from "@/components/ui/hint";
import { Globe, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TabbedLeftPanel = () => {
    const pathname = usePathname();
    
    const sidebarItems = [
        { icon: LinkIcon, label: "REST", href: "/workspace", match: "/workspace" },
        { icon: Globe, label: "Realtime", href: "/workspace/realtime", match: "/workspace/realtime" },
    ];

    const isActive = (match: string) => {
        if (match === "/workspace") {
            return pathname === "/workspace";
        }
        return pathname.startsWith(match);
    };

    return (
        <div className="flex h-full w-full flex-col bg-canvas py-3 items-center gap-2">
            {sidebarItems.map((item, index) => (
                <Hint label={item.label} key={index} side="right">
                    <Link
                        href={item.href}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 ${isActive(item.match)
                                ? "bg-line text-blue-400"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-line/50"
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                    </Link>
                </Hint>
            ))}
        </div>
    );
};

export default TabbedLeftPanel;