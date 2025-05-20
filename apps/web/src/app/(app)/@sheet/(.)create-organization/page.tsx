import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/intercepted-sheet'

import { OrganizationForm } from '../../org/organization-form'

export default function CreateOrganization() {
  return (
    <Sheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create organization</SheetTitle>
        </SheetHeader>

        <div className="py-4">
          <OrganizationForm />
        </div>
      </SheetContent>
    </Sheet>
  )
}
