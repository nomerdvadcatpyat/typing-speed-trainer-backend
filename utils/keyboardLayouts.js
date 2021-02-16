const keyboardLayouts = {
	// ru: [ "й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ", "ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э", "я", "ч", "с", "м", "и", "т", "ь", "б", "ю" ],
	en: [
		[
			{ withoutShift: "`", withShift: "~" },
			{ withoutShift: "1", withShift: "!" },
			{ withoutShift: "2", withShift: "@" },
			{ withoutShift: "3", withShift: "#" },
			{ withoutShift: "4", withShift: "$" },
			{ withoutShift: "5", withShift: "%" },
			{ withoutShift: "6", withShift: "^" },
			{ withoutShift: "7", withShift: "&" },
			{ withoutShift: "8", withShift: "*" },
			{ withoutShift: "9", withShift: "(" },
			{ withoutShift: "0", withShift: ")" },
			{ withoutShift: "-", withShift: "_" },
			{ withoutShift: "=", withShift: "+" },
			{ specialKey: "Backspace"}
		],
		[
			{ withoutShift: "q", withShift: "Q" },
			{ withoutShift: "w", withShift: "W" },
			{ withoutShift: "e", withShift: "E" },
			{ withoutShift: "r", withShift: "R" },
			{ withoutShift: "t", withShift: "T" },
			{ withoutShift: "y", withShift: "Y" },
			{ withoutShift: "u", withShift: "U" },
			{ withoutShift: "i", withShift: "I" },
			{ withoutShift: "o", withShift: "O" },
			{ withoutShift: "p", withShift: "P" },
			{ withoutShift: "[", withShift: "{" },
			{ withoutShift: "]", withShift: "}" }
		],
		[
			{ withoutShift: "a", withShift: "A" },
			{ withoutShift: "s", withShift: "S" },
			{ withoutShift: "d", withShift: "D" },
			{ withoutShift: "f", withShift: "F" },
			{ withoutShift: "g", withShift: "G" },
			{ withoutShift: "h", withShift: "H" },
			{ withoutShift: "j", withShift: "J" },
			{ withoutShift: "k", withShift: "K" },
			{ withoutShift: "l", withShift: "L" },
			{ withoutShift: ";", withShift: ":" },
			{ withoutShift: "'", withShift: '"' },
			{ withoutShift: "\\", withShift: '|' }
		],
		[
			{ specialKey: "LeftShift"},
			{ withoutShift: "z", withShift: "Z" },
			{ withoutShift: "x", withShift: "X" },
			{ withoutShift: "c", withShift: "C" },
			{ withoutShift: "v", withShift: "V" },
			{ withoutShift: "b", withShift: "B" },
			{ withoutShift: "n", withShift: "N" },
			{ withoutShift: "m", withShift: "M" },
			{ withoutShift: ",", withShift: "<" },
			{ withoutShift: ".", withShift: ">" },
			{ withoutShift: "/", withShift: "?" },
			{ specialKey: "RightShift"}
		],
	[{ specialKey: "Space"}]
	]
}

module.exports = keyboardLayouts;