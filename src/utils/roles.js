// utils/roles.js
export const roleMap = {
    service_engineer: "Service Engineer",
    maintainer: "Maintainer",
    admin: "Admin"
  };
  
  export const formatRole = (rawRole) => {
    return roleMap[rawRole] || "Role not assign to this user";
  };
  