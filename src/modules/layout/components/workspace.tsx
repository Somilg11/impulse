"use client";

import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { Loader, Plus, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";


const Workspace = () => {
    return (
        <>
        <Hint label="Change Workspace">
            <Select>
                <SelectTrigger className="w-32 bg-transparent border-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Workspace" className="text-sm text-gray-300"/>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-800">
                    <SelectItem value="workspace-1" className="text-gray-300 hover:bg-zinc-800">Workspace 1</SelectItem>
                    <SelectItem value="workspace-2" className="text-gray-300 hover:bg-zinc-800">Workspace 2</SelectItem>
                </SelectContent>
            </Select>
        </Hint>
        </>
    )
}

export default Workspace;