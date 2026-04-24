"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChequeStatus = exports.PendingStatus = exports.UnmatchedSystemStatus = exports.RunMemberRole = exports.RunStatus = void 0;
var RunStatus;
(function (RunStatus) {
    RunStatus["OPEN"] = "OPEN";
    RunStatus["CLOSED"] = "CLOSED";
})(RunStatus || (exports.RunStatus = RunStatus = {}));
var RunMemberRole;
(function (RunMemberRole) {
    RunMemberRole["OWNER"] = "OWNER";
    RunMemberRole["EDITOR"] = "EDITOR";
    RunMemberRole["VIEWER"] = "VIEWER";
})(RunMemberRole || (exports.RunMemberRole = RunMemberRole = {}));
var UnmatchedSystemStatus;
(function (UnmatchedSystemStatus) {
    UnmatchedSystemStatus["OVERDUE"] = "OVERDUE";
    UnmatchedSystemStatus["DEFERRED"] = "DEFERRED";
})(UnmatchedSystemStatus || (exports.UnmatchedSystemStatus = UnmatchedSystemStatus = {}));
var PendingStatus;
(function (PendingStatus) {
    PendingStatus["OPEN"] = "OPEN";
    PendingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PendingStatus["RESOLVED"] = "RESOLVED";
})(PendingStatus || (exports.PendingStatus = PendingStatus = {}));
var ChequeStatus;
(function (ChequeStatus) {
    ChequeStatus["ISSUED"] = "ISSUED";
    ChequeStatus["CLEARED"] = "CLEARED";
    ChequeStatus["OVERDUE"] = "OVERDUE";
})(ChequeStatus || (exports.ChequeStatus = ChequeStatus = {}));
//# sourceMappingURL=enums.js.map