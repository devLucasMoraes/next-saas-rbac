import { ProjectForm } from '@/app/(app)/org/[slug]/create-project/project-form'
import { SheetContent } from '@/components/intercepted-sheet'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export default function CreateProject() {
  return (
    <Sheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create project</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          <ProjectForm />
        </div>
      </SheetContent>
    </Sheet>
  )
}
