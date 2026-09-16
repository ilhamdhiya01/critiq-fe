import { Role } from "./auth.types";
import { Organization } from "./organization.types";

type MembershipStatus = "ACTIVE" | "INVITED";

export interface MembershipWithOrg {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: MembershipStatus;
  organization: Organization;
}
