import { currentuser } from "@/modules/authentication/actions";
import UserButton from "@/modules/authentication/components/user-button";


export default async function Home() {
  const user = await currentuser();
  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center">
        <UserButton user={user} />
      </div>
    </>
  );
}
