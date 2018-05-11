// Learn codes here:
// http://rm-bridge.fun2code.de/rm_manage/code_learning.html

// After learning a code, define the command name
// mac address or ip address and leave the data as is.
// add a secret value that must match the request in order to validate (sent as POST parameter).

/*
Example:

    {
        "command": "YOUR_COMMAND_HERE",
        "secret": "SET_A_RANDOM_HASH_HERE",
        "ip": "YOUR_DEVICE_IP_HERE",
        "mac": "MAC_ADDRESS_HERE", // Use mac instead of IP when possible.
        "sequence": ["command", "command"], // If sequence is defined, all the commands inside the array will be run in sequence.
        "data": "RM_BRIDGE_DATA_HERE" // only runs if there is no sequence defined.
    }
*/

module.exports = [{
        "command": "TV_On",
        "secret": "34KN342KNnjnj22",
        "mac":"b4:43:0d:fb:d2:5a",
        "data": "260050000001269013121212131212121312121213121213123712371237123712371237123713121212133613121236131213121212131212371312123712111436143513371237120005370001264813000d050000000000000000"
    },
    {
        "command": "TV_Off",
        "secret": "34KN342KNnjnj22",
        "mac": "0d:43:b4:fb:d2:5a",
        "data": "260050000001269013121212131212121312121213121213123712371237123712371237123713121212133613121236131213121212131212371312123712111436143513371237120005370001264813000d050000000000000000"
    },
    {
        "command": "TV_Volumn_Up",
        "secret": "34KN342KNnjnj22",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "260050000001259213111312121213121212131212121312133613361336133613361337123712121312123712371237133613121212131212371212131212121312123712371336130005370001244a13000d050000000000000000"
    },
    {
        "command": "TV_Volumn_Down",
        "secret": "34KN342KNnjnj22",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "2600a80113522e111807281129110e241312281642091c2310120c0d2d120b071508334a0c071508152812071509300e1407142f0c082f0f110f0f0001fd170002840e0002880d00027b120002801300027f14000281100001b000012492160f14101510150f160f1411141013121435143017371237123713361336131212371237153414351534141113361510131114111410150f15101435150f15351400029b1300028000012c4a130001071500027e12000282100002830e0002821300027f1f0002741100028112000283100005131300027f1400027c150002800f000288100002810f00027f0f000284191c053e0718065c0929072a0737064207ac11e9071a0c1a061a057c085b091606190600029a1000028112000282110002801c1b073c0817065d052c09280738074006a914ea091b0740093a0818055d075b071808180500025a0d00027a140002890a00027e15480a1a063d0818055d0928062b08370740085a15000136091b0642073c0718065c081311360818051a060001860a1a083b08130d5a082908290639083f080001361659091b063d06420718085a09590a140a1708000d05"
    },
    {
        "command": "change_to_Chromecast",
        "secret": "JSDJF34Jsdsd343",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "2600500000013593151114121412131215111412151114371437143614371536153614371437141115111412153614121412141115111511143714371411153614371437143714361500050b0001354914000d050000000000000000"
    },
    {
        "command": "change_to_Cable",
        "secret": "JSDJF34Jsdsd343",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "2600500000013493141116101511141214111511151114371436143714371436153614371437141115111437143615111511141214111511143714111511153614361536153614371400050b0001354715000d050000000000000000"
    },
{
        "command": "change_to_cable",
        "secret": "JSDJF34Jsdsd343",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "2600500000013493141116101511141214111511151114371436143714371436153614371437141115111437143615111511141214111511143714111511153614361536153614371400050b0001354715000d050000000000000000"
    },
    {
        "command": "change_to_PlayStation",
        "secret": "JSDJF34Jsdsd343",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "2600500000013494151115101412151114131312131413361437153614371436153615361635141115111338151114111511151114121312153615111338143713371437143715361400050c0001344815000d050000000000000000"
    },
    {
        "command": "TV_Menu",
        "secret": "kERKN3432knN23",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "260078000a1a093a09160a580a2809280a340a3e0a0001a30a1a09500a150a16082008180817081709000a600a1a0a390a1609590a270a270a350a3d0a0001a30a1a0a2c0a390a150920081708180817080001840a1a0a390a1609590a270a270a340b3d0a0001a30a1a0a270a3e0a150a1f08170818081708000d05"
    },
    {
        "command": "TV_Down",
        "secret": "kERKN3432knN23",
        "mac": "0d:43:b4:fb:d2:5a",
        "data": "26007400061e053e051a065c062b062c05390642050001a8051e064b0619061a0523062206000aa2061e063d061a055d062b062b06390641060001a7061e0627063d0619062305230619061a05000187061e063d0619065d062b062b06390641060001a7061e062206420619062305230619061a05000d0500000000"
    },
    {
        "command": "TV_OK",
        "secret": "kERKN3432knN23",
        "mac":"0d:43:b4:fb:d2:5a",
        "data": "26006a00091b093a0718065c0929092807370a3e090001a4091b093a071809170721072f071806000a820a1a083b0a160959092809280a35093e090001a4091b0917093a0916091f092d0916081809000183091b093a0917075b072a09280936093e090001a4071d075b07000d050000000000000000000000000000"
    },
    {
        "command": "TV_Go_To_VOD",
        "secret": "sdfdsf24234SDFfef",
        "mac":"0d:43:b4:fb:d2:5a",
        "sequence": ["TV_Menu", "TV_Down", "TV_Down", "TV_OK"]
    }
];
