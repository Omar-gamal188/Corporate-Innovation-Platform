/** Strips sensitive/internal fields before a User document is sent to the client. */
function toSafeUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    department: user.department,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

module.exports = toSafeUser;
