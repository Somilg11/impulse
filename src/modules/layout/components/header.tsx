"use client";

import { Terminal, Menu, X } from "lucide-react";
import Link from "next/link";
import UserButton from "@/modules/authentication/components/user-button";
import { UserProps } from "../types";
import Workspace from "./workspace";
import InviteMember from "./invite-member";
import { useState } from "react";

import SearchBar from "./search-bar";
import EnvironmentSelector from "@/modules/environments/components/environment-selector";

interface Props {
    user: UserProps;
}

const Header = ({ user }: Props) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="px-4 h-12 flex items-center justify-between border-b border-line bg-canvas sticky top-0 z-50 relative">
            {/* Left: logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                <div className="bg-blue-600 rounded-md p-1 flex items-center justify-center">
                    <Terminal className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold tracking-tight text-white hidden sm:inline" style={{ lineHeight: 1 }}>impulse</span>
            </Link>

            {/* Center: workspace selector */}
            <div className="absolute left-1/2 -translate-x-1/2">
                <Workspace />
            </div>

            {/* Right: actions */}
            <div className="hidden md:flex items-center gap-3">
                <EnvironmentSelector />
                <SearchBar />
                <div className="h-4 w-px bg-line" />
                <InviteMember />
                <UserButton user={user} size="sm" />
            </div>

            {/* Mobile hamburger */}
            <button
                className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Mobile dropdown */}
            {mobileMenuOpen && (
                <div className="absolute top-12 left-0 right-0 bg-canvas border-b border-line p-3 space-y-3 md:hidden z-50">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <InviteMember />
                            <UserButton user={user} size="sm" />
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Header;