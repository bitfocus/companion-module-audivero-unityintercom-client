//Surface models we can present ourselves as in the Poll response.
//
//The Unity Keypanel Protocol derives the button number from the rows/columns we
//advertise (buttonNumber = page * rows * columns + columns * row + column), and the
//client lays out its panel configuration UI from the ProductID. If the two disagree -
//as they did in 2.1.0, which claimed to be a Stream Deck + while advertising a 4x8 grid -
//the client cannot render the panel correctly.
//
//Keeping the ID and the geometry in one table is the point of this file: they must
//only ever be changed together.
//
//Note on the Plus: the protocol doc's ID table lists Stream Deck Plus as 9004, but the
//doc's own worked example shows ProductID 9007 for a device named "A Stream Deck + "
//(with Rows 2, Columns 4), and 9007 is what has been observed to actually enable the
//rotary actions. We follow the example rather than the table.

const SURFACE_MODELS = [
	{ id: '9000', label: 'Stream Deck Original (3x5)', productId: 9000, rows: 3, columns: 5, encoders: 0 },
	{ id: '9001', label: 'Stream Deck Mini (2x3)', productId: 9001, rows: 2, columns: 3, encoders: 0 },
	{ id: '9002', label: 'Stream Deck XL (4x8)', productId: 9002, rows: 4, columns: 8, encoders: 0 },
	//Mobile has a user-configurable grid; 3x5 is a reasonable stand-in, not from the doc
	{ id: '9003', label: 'Stream Deck Mobile (3x5)', productId: 9003, rows: 3, columns: 5, encoders: 0 },
	{ id: '9007', label: 'Stream Deck + (2x4, 4 dials)', productId: 9007, rows: 2, columns: 4, encoders: 4 },
	{ id: '9009', label: 'Stream Deck Neo (2x4)', productId: 9009, rows: 2, columns: 4, encoders: 0 },
	{ id: '9010', label: 'Stream Deck Studio (2x16)', productId: 9010, rows: 2, columns: 16, encoders: 0 },
	//Plus XL: the doc gives the encoder count (0-5) but not the grid, so 4x8 is an assumption
	{ id: '9013', label: 'Stream Deck Plus XL (4x8, 6 dials)', productId: 9013, rows: 4, columns: 8, encoders: 6 },
]

//Stream Deck XL was the pairing shipped in 2.0.0, the last version known to work.
const DEFAULT_SURFACE_MODEL = '9002'

module.exports = {
	SURFACE_MODELS,
	DEFAULT_SURFACE_MODEL,

	CHOICES_SURFACE_MODELS: SURFACE_MODELS.map((m) => ({ id: m.id, label: m.label })),

	getSurfaceModel: function (id) {
		return SURFACE_MODELS.find((m) => m.id === String(id)) || SURFACE_MODELS.find((m) => m.id === DEFAULT_SURFACE_MODEL)
	},
}
