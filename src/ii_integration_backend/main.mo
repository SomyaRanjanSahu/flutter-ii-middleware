import Principal "mo:base/Principal";
actor {
    public shared (msg) func whoami() : async Text {
        Principal.toText(msg.caller);
    };
};
