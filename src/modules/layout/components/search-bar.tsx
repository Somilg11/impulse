import React, { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Search } from "lucide-react";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

const SearchBar = () => {
    const [open, setOpen] = useState(false)
    
    useHotkeys("meta+k, ctrl+k", (e) => {
        e.preventDefault();
        setOpen((prev) => !prev);
    }, { enableOnFormTags: true });
    return (
        <>
            {/* Search Button */}
            <button
                onClick={() => setOpen(true)}
                className="relative flex flex-1 cursor-text items-center justify-between self-stretch rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50 overflow-hidden"
            >
                <span className="inline-flex flex-1 items-center">
                    <Search size={14} className="mr-2 text-zinc-500" />
                    <span className="text-[12px] text-left pr-2">Search collections and docs</span>
                </span>
                <span className="flex space-x-1 items-center">
                    <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 text-zinc-500 border border-white/5 rounded">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 text-zinc-500 border border-white/5 rounded">K</kbd>
                </span>
            </button>

            {/* Command Dialog */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="bg-canvas border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <CommandInput
                        placeholder="Type a command or search..."
                        className="bg-transparent border-none text-zinc-200 placeholder:text-zinc-500 h-12"
                    />
                    <CommandList className="bg-transparent max-h-[300px] overflow-y-auto">
                        <CommandEmpty className="text-zinc-500 py-6 text-center text-[13px]">No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions" className="px-2 pb-2">
                            <CommandItem onSelect={() => setOpen(false)} className="text-zinc-300 hover:bg-white/5 rounded-lg flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-[--duration-fast] ease-[--ease-ios]">
                                <span className="p-1 bg-brand/10 rounded text-brand text-[12px] font-bold uppercase tracking-wider">REST</span>
                                <span className="text-[13px]">Pre-request Script</span>
                            </CommandItem>
                            <CommandItem onSelect={() => setOpen(false)} className="text-zinc-300 hover:bg-white/5 rounded-lg flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-[--duration-fast] ease-[--ease-ios]">
                                <span className="p-1 bg-green-500/10 rounded text-green-400 text-[12px] font-bold uppercase tracking-wider">TEST</span>
                                <span className="text-[13px]">Tests</span>
                            </CommandItem>
                            <CommandItem onSelect={() => setOpen(false)} className="text-zinc-300 hover:bg-white/5 rounded-lg flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-[--duration-fast] ease-[--ease-ios]">
                                <span className="p-1 bg-purple-500/10 rounded text-purple-400 text-[12px] font-bold uppercase tracking-wider">ENV</span>
                                <span className="text-[13px]">Variables</span>
                            </CommandItem>
                            <CommandItem onSelect={() => setOpen(false)} className="text-zinc-300 hover:bg-white/5 rounded-lg flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors duration-[--duration-fast] ease-[--ease-ios]">
                                <span className="p-1 bg-yellow-500/10 rounded text-yellow-400 text-[12px] font-bold uppercase tracking-wider">DOCS</span>
                                <span className="text-[13px]">Documentation</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>

                    {/* Bottom navigation hints */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-white/5">
                        <div className="flex items-center space-x-4 text-[11px] text-zinc-500">
                            <div className="flex items-center space-x-1">
                                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px]">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px]">↓</kbd>
                                <span>to navigate</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px]">↵</kbd>
                                <span>to select</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 text-[11px] text-zinc-500 font-medium">
                            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px]">ESC</kbd>
                            <span>close</span>
                        </div>
                    </div>
                </div>
            </CommandDialog>
        </>
    )
}

export default SearchBar;