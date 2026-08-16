/* Breathe-Easy Scheduler — Firebase Google Sign-In + allowlist roles */

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyDummyReplaceIfNeeded",
    authDomain: "breathe-easy-scheduler.firebaseapp.com",
    projectId: "breathe-easy-scheduler",
    appId: "1:000000000000:web:0000000000000000000000"
  };

  /**
   * Role allowlist
   * office  = full app (Office + Technician toggle)
   * tech    = Technician view only (no Office, no toggle)
   *
   * Add / move emails anytime — no other code changes needed.
   */
  const ALLOWLIST = {
    "jefflamb1992@gmail.com": { role: "office" },

    "joshua@breathe-easyhk.com": { role: "tech" },
    "iamruby112@gmail.com": { role: "tech" },
    "matthewgross2001@gmail.com": { role: "tech" },
    "tiagogiri334@gmail.com": { role: "tech" },
    "iggi.king@gmail.com": { role: "tech" },
    "neltrestium@gmail.com": { role: "tech" },
    "sudor23@gmail.com": { role: "tech" },
    "itstartswiththemind@gmail.com": { role: "tech" },
    "n.marie.lamb@gmail.com": { role: "tech" }
  };

  function resolveRole(email) {
    const key = (email || "").toLowerCase().trim();
    const entry = ALLOWLIST[key];
    return entry ? entry.role : null;
  }

  // Rest of auth — preserve from live file via read
