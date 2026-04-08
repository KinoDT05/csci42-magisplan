import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ProfilePage({
  params,
}: {
    params: Promise<{ id: string }>;
}) {
  const { id } = await params; 

  const { data: user, userError } = await supabase
    .from("users")
    .select("firstName, lastName, contactNumber")
    .eq("userID", id)
    .single();

  const { data: projectsData, projectsError } = await supabase
    .from("project_members")
    .select(`
      role,
      projects (
        projectName
      )
    `)
    .eq("userID", id);
  
  if (userError) {
    console.error("User error:", userError);
  }

  if (projectsError) {
    console.error("Projects error:", projectsError);
  }

  return (
    <div className="w-full px-6 py-6">

      {/* profile details */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-20">

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48 flex items-center justify-center bg-[var(--txt-gray)] text-white rounded-full">
            <p className="text-center">No Available Image</p>
          </div>

          <div className="flex flex-col justify-center text-[var(--main)]">
            {user ? (
              <>
                <p className="font-semibold text-5xl">{user.firstName} {user.lastName}</p>
                <p className="text-2xl">{user.contactNumber}</p>
              </>
            ) : (
              <p>Error</p>
            )}
          </div>
        </div>
        
        <div className="md:ml-auto">
          <div className="btn-secondary font-semibold"><a href="">Edit Details</a></div>
        </div>
        
      </div>


      {/* header */}
      <div className="flex gap-6 text-center mb-5">
        <div className="w-2/3 bg-[#E6E6E6] rounded-xl p-5 font-semibold shadow-md">
          Project
        </div>

        <div className="w-1/3 bg-[#E6E6E6] rounded-xl p-5 font-semibold shadow-md">
          Role
        </div>
      </div>

      {/* list */}
      <div className="flex gap-6">
        <div className="w-2/3 bg-[#E6E6E6] rounded-xl p-5 shadow-md text-center">
          {projectsData?.map((item, index) => (
            <div key={index} className="mb-2">
              {item.projects?.projectName}
            </div>
          ))}
        </div>

        <div className="w-1/3 bg-[#E6E6E6] rounded-xl p-5 shadow-md text-center">
          {projectsData?.map((item, index) => (
            <div key={index} className="mb-2">
              {item.role}
            </div>
          ))}
        </div>

      </div>

     


    </div>
  );
}