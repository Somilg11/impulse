"use client";

import {AudioLines} from "lucide-react";
import UserButton from "@/modules/authentication/components/user-button";
import { UserProps } from "../types";
import SearchBar from "./search-bar";
import Workspace from "./workspace";
import InviteMember from "./invite-member";

interface Props {
    user: UserProps;
}

const Header = ({ user }: Props) => {
    return (
        <header className="grid grid-cols-5 grid-rows-1 gap-2 overflow-x-auto overflow-hidden p-2 border">
            <div className="col-span-2 flex items-center justify-between space-x-2 hover:cursor-pointer hover:opacity-80 ml-4">
                <AudioLines size={28} className="text-blue-500"/>
            </div>
            <div className="col-span-1 flex items-center justify-between space-x-2">
                <div className="border-animation relative p-px rounded flex-1 self-stretch overflow-hidden flex items-center justifycenter" aria-hidden="true">
                    <SearchBar />
                </div>
            </div>

            <div className="col-span-2 flex items-center justify-end space-x-2 hover:cursor-pointer hover:opacity-80">
                {/* invite-member */}
                <InviteMember />
                {/* workspace */}
                <Workspace />
                <UserButton user={user} size="sm"/>
            </div>
        </header>
    )
}

export default Header;