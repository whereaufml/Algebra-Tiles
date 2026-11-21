import {
  GlossaryItem,
  LevelConfig,
  Mission,
  TopicConfig,
  AssessmentItem,
} from '../types/algebra';

/**
 * KONFIGURASI MATERI & KURIKULUM ALGEBRA QUEST
 * Catatan: Konten di bawah bersifat modular dan umum (tidak mengunci jenjang/kelas tertentu)
 * sehingga guru atau peneliti dapat menyesuaikan urutan level, misi, dan soal sesuai LKPD.
 */
export const CURRICULUM_META = {
  versionLabel: 'Konfigurasi Materi Umum (Dapat Disesuaikan)',
  note: 'Jenjang kelas dan cakupan materi penelitian dapat disesuaikan langsung pada file konfigurasi kurikulum atau melalui Mode Guru.',
};

export const LEVELS_CONFIG: LevelConfig[] = [
  {
    id: 'level-1',
    number: '01',
    title: 'Dasar Ubin Aljabar',
    shortTitle: 'Dasar Algebra',
    description:
      'Mengenal ubin x², x, dan 1 beserta tanda positif dan negatif untuk membentuk ekspresi aljabar.',
    learningObjectives: [
      'Membedakan ubin variabel (x², x) dan konstanta (1) melalui bentuk dan tanda.',
      'Menyusun ekspresi aljabar sederhana dari model ubin.',
    ],
    color: '#27A89A',
  },
  {
    id: 'level-2',
    number: '02',
    title: 'Suku Sejenis (Like Terms)',
    shortTitle: 'Suku Sejenis',
    description:
      'Mengelompokkan dan menggabungkan ubin yang memiliki jenis suku sama serta memahami mengapa suku berbeda tidak boleh digabung.',
    learningObjectives: [
      'Menggabungkan suku sejenis seperti 2x + 3x menjadi 5x.',
      'Menjelaskan mengapa 2x + 3 tidak dapat disederhanakan menjadi 5x atau 5.',
    ],
    color: '#3A86D8',
    prerequisiteLevelId: 'level-1',
  },
  {
    id: 'level-3',
    number: '03',
    title: 'Pasangan Nol (Zero Pairs)',
    shortTitle: 'Zero Pairs',
    description:
      'Menemukan ubin positif dan negatif sejenis yang saling meniadakan untuk menyederhanakan ekspresi dan memodelkan pengurangan.',
    learningObjectives: [
      'Membentuk zero pair (+x dengan −x, +1 dengan −1, +x² dengan −x²).',
      'Menyederhanakan ekspresi aljabar yang memuat suku positif dan negatif.',
    ],
    color: '#EF8748',
    prerequisiteLevelId: 'level-2',
  },
  {
    id: 'level-4',
    number: '04',
    title: 'Keseimbangan Persamaan',
    shortTitle: 'Persamaan',
    description:
      'Menjaga kesetaraan sisi kiri dan sisi kanan papan persamaan dengan menerapkan operasi yang sama pada kedua sisi.',
    learningObjectives: [
      'Memodelkan persamaan linear satu variabel seperti x + 3 = 5.',
      'Menyelesaikan persamaan dengan menjaga keseimbangan operasi di kedua sisi.',
    ],
    color: '#5943A8',
    prerequisiteLevelId: 'level-3',
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Variabel (x, x²)',
    definition:
      'Simbol yang mewakili nilai yang belum diketahui atau dapat berubah. Pada Algebra Tiles, x digambarkan sebagai persegi panjang dan x² sebagai persegi besar.',
    example: 'Pada 3x + 2, huruf x adalah variabel.',
  },
  {
    term: 'Koefisien',
    definition:
      'Bilangan pengali di depan variabel yang menunjukkan banyaknya ubin variabel tersebut.',
    example: 'Pada 4x, angka 4 adalah koefisien (berarti ada 4 ubin +x).',
  },
  {
    term: 'Konstanta (1, −1)',
    definition:
      'Nilai bilangan tetap tanpa variabel, diwakili oleh ubin persegi kecil +1 atau −1.',
    example: 'Pada 2x + 5, bilangan 5 adalah konstanta.',
  },
  {
    term: 'Suku Sejenis (Like Terms)',
    definition:
      'Suku-suku yang memiliki variabel dan pangkat yang sama sehingga dapat digabungkan jumlahnya.',
    example: '2x dan 3x adalah suku sejenis (2x + 3x = 5x), sedangkan 2x dan 3 bukan suku sejenis.',
  },
  {
    term: 'Zero Pair (Pasangan Nol)',
    definition:
      'Sepasang ubin dengan jenis suku yang sama tetapi tanda berlawanan (+ dan −) sehingga jumlah nilainya 0.',
    example: '+x + (−x) = 0 dan +1 + (−1) = 0.',
  },
  {
    term: 'Kesetaraan Persamaan',
    definition:
      'Prinsip bahwa sisi kiri dan kanan tanda sama dengan (=) harus selalu memiliki nilai seimbang saat dioperasikan.',
    example: 'Jika x + 3 = 5, kurangi 3 (tambah −3) pada kedua sisi sehingga x = 2.',
  },
];

export const TOPICS_CONFIG: TopicConfig[] = [
  {
    id: 'topic-dasar',
    levelId: 'level-1',
    title: '01. Mengenal Ubin Aljabar',
    subtitle: 'Memahami bentuk, warna, serta tanda + dan − pada ubin x², x, dan 1',
    estimatedMinutes: 5,
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'Tiga Bentuk Dasar Algebra Tiles',
        objective: 'Mengenali ubin persegi besar (x²), persegi panjang (x), dan persegi kecil (1).',
        explanation:
          'Algebra Tiles membantu kita melihat suku aljabar sebagai benda nyata. Persegi besar mewakili x², persegi panjang mewakili x, dan persegi kecil mewakili konstanta 1. Perbedaan ukuran ini penting agar kita tidak mencampur suku yang berbeda.',
        visualDemo: {
          caption: 'Contoh susunan 1 ubin +x², 2 ubin +x, dan 3 ubin +1',
          tiles: [
            { type: 'x2', sign: 1, count: 1 },
            { type: 'x', sign: 1, count: 2 },
            { type: '1', sign: 1, count: 3 },
          ],
          symbolicResult: 'x² + 2x + 3',
          highlightNote: 'Setiap ubin selalu menampilkan label simbolik dan tanda + atau −.',
        },
        summary: 'x² = persegi besar, x = persegi panjang, 1 = persegi kecil.',
        checkQuestion: {
          prompt: 'Jika terdapat 2 ubin persegi panjang bertanda +x dan 4 ubin persegi kecil bertanda +1, ekspresi apa yang terbentuk?',
          options: ['2x² + 4', '2x + 4', '6x', 'x + 6'],
          correctIndex: 1,
          explanation:
            '2 ubin +x bernilai 2x dan 4 ubin +1 bernilai 4. Keduanya suku berbeda sehingga ditulis 2x + 4.',
        },
      },
      {
        id: 'lesson-1-2',
        title: 'Ubin Positif dan Ubin Negatif',
        objective: 'Membedakan tanda + (biru/toska) dan tanda − (jingga/merah).',
        explanation:
          'Setiap jenis suku memiliki versi positif dan negatif. Ubin positif berwarna biru/toska dengan tanda +, sedangkan ubin negatif berwarna jingga/merah dengan tanda −. Tanda pada ubin menentukan koefisien suku tersebut.',
        visualDemo: {
          caption: 'Model untuk −x² + 2x − 3',
          tiles: [
            { type: 'x2', sign: -1, count: 1 },
            { type: 'x', sign: 1, count: 2 },
            { type: '1', sign: -1, count: 3 },
          ],
          symbolicResult: '−x² + 2x − 3',
          highlightNote: 'Jangan hanya melihat warna—perhatikan juga simbol + atau − di tengah ubin.',
        },
        summary: 'Ubin negatif memiliki bentuk yang sama dengan versi positifnya, dengan warna berbeda dan tanda −.',
        checkQuestion: {
          prompt: 'Manakah representasi ubin yang tepat untuk ekspresi 3x − 2?',
          options: [
            '3 ubin +x dan 2 ubin +1',
            '3 ubin −x dan 2 ubin −1',
            '3 ubin +x dan 2 ubin −1',
            '1 ubin +x² dan 2 ubin −1',
          ],
          correctIndex: 2,
          explanation: '3x positif diwakili 3 ubin +x, dan −2 diwakili 2 ubin −1.',
        },
      },
    ],
  },
  {
    id: 'topic-suku-sejenis',
    levelId: 'level-2',
    title: '02. Menggabungkan Suku Sejenis',
    subtitle: 'Menyatukan ubin yang sejenis dan memahami batasannya',
    estimatedMinutes: 6,
    lessons: [
      {
        id: 'lesson-2-1',
        title: 'Mengapa Hanya Suku Sejenis yang Bisa Digabung?',
        objective: 'Menggabungkan 2x + 3x menjadi 5x dan 2 + 4 menjadi 6.',
        explanation:
          'Ketika kita memiliki 2 ubin +x lalu menambah 3 ubin +x lagi, seluruhnya berbentuk persegi panjang x yang sama, sehingga menjadi 5x. Hal yang sama berlaku pada 2 ubin +1 dan 4 ubin +1 yang menjadi 6.',
        visualDemo: {
          caption: 'Menggabungkan 2x + 3x + 2 + 4',
          tiles: [
            { type: 'x', sign: 1, count: 5 },
            { type: '1', sign: 1, count: 6 },
          ],
          symbolicResult: '5x + 6',
          highlightNote: '5x dan 6 tetap terpisah karena bentuk ubinnya berbeda.',
        },
        summary: 'Hanya ubin dengan bentuk/jenis suku yang sama yang dapat dijumlahkan koefisiennya.',
        checkQuestion: {
          prompt: 'Mengapa 2x + 3 TIDAK dapat disederhanakan menjadi 5x?',
          options: [
            'Karena 2 dan 3 tidak bisa dijumlahkan dalam matematika',
            'Karena ubin x dan ubin 1 mewakili jenis suku yang berbeda',
            'Karena koefisien x harus selalu lebih besar dari konstanta',
            'Karena tanda + tidak berlaku untuk aljabar',
          ],
          correctIndex: 1,
          explanation:
            'Ubin x adalah variabel sedangkan ubin 1 adalah konstanta. Jenis sukunya berbeda sehingga 2x + 3 sudah dalam bentuk paling sederhana.',
        },
      },
    ],
  },
  {
    id: 'topic-zero-pair',
    levelId: 'level-3',
    title: '03. Zero Pairs & Pengurangan',
    subtitle: 'Memahami pasangan nol (+ dan −) serta cara menyederhanakan ekspresi',
    estimatedMinutes: 6,
    lessons: [
      {
        id: 'lesson-3-1',
        title: 'Konsep Zero Pair (Pasangan Nol)',
        objective: 'Menemukan dan meniadakan pasangan +x dengan −x atau +1 dengan −1.',
        explanation:
          'Satu ubin positif dan satu ubin negatif dari jenis suku yang sama berjumlah tepat 0. Pasangan ini disebut Zero Pair. Karena nilainya 0, pasangan tersebut dapat disingkirkan tanpa mengubah nilai keseluruhan ekspresi!',
        visualDemo: {
          caption: '3 ubin +x dan 1 ubin −x membentuk 1 zero pair, menyisakan 2x',
          tiles: [
            { type: 'x', sign: 1, count: 3 },
            { type: 'x', sign: -1, count: 1 },
          ],
          symbolicResult: '2x',
          highlightNote: 'Satu +x berpasangan dengan satu −x menjadi 0, tersisa 2 ubin +x.',
        },
        summary: 'Zero pair hanya terbentuk jika jenis suku SAMA dan tanda BERLAWANAN.',
        checkQuestion: {
          prompt: 'Manakah pasangan ubin berikut yang membentuk Zero Pair?',
          options: ['+x dan −1', '+x² dan −x', '+x dan −x', '+1 dan +1'],
          correctIndex: 2,
          explanation: '+x dan −x memiliki jenis suku yang sama (x) dengan tanda berlawanan (+ dan −).',
        },
      },
      {
        id: 'lesson-3-2',
        title: 'Pengurangan Sebagai Penambahan Lawan',
        objective: 'Memahami pengurangan aljabar menggunakan ubin negatif.',
        explanation:
          'Mengurangi suatu suku sama artinya dengan menambahkan lawannya. Misalnya, 4 − 2 dapat dimodelkan sebagai 4 ubin +1 ditambah 2 ubin −1, lalu menghilangkan 2 zero pair sehingga tersisa +2.',
        visualDemo: {
          caption: 'Memodelkan 4 + (−2) dengan zero pair menghasilkan 2',
          tiles: [
            { type: '1', sign: 1, count: 4 },
            { type: '1', sign: -1, count: 2 },
          ],
          symbolicResult: '2',
          highlightNote: 'Dua pasangan (+1 dan −1) menjadi 0, tersisa dua ubin +1.',
        },
        summary: 'Pengurangan a − b dapat dipandang sebagai a + (−b).',
        checkQuestion: {
          prompt: 'Jika di workspace ada 2 ubin +x, lalu kamu menambahkan 3 ubin −x dan menghapus zero pairs, apa hasilnya?',
          options: ['+x', '−x', '5x', '0'],
          correctIndex: 1,
          explanation: '2 pasang (+x dan −x) menjadi nol, menyisakan 1 ubin −x.',
        },
      },
    ],
  },
  {
    id: 'topic-persamaan',
    levelId: 'level-4',
    title: '04. Keseimbangan Persamaan',
    subtitle: 'Menyelesaikan persamaan linear satu variabel dengan prinsip timbangan',
    estimatedMinutes: 7,
    lessons: [
      {
        id: 'lesson-4-1',
        title: 'Menjaga Kesetaraan Kedua Sisi',
        objective: 'Menerapkan operasi yang sama pada sisi kiri dan sisi kanan persamaan.',
        explanation:
          'Bayangkan tanda sama dengan (=) sebagai titik tengah timbangan yang seimbang. Jika kamu menambahkan −3 di sisi kiri untuk menghilangkan +3 pada x + 3 = 5, kamu WAJIB menambahkan −3 juga di sisi kanan agar kesetaraan tetap terjaga.',
        visualDemo: {
          caption: 'Persamaan awal x + 3 = 5',
          tiles: [
            { type: 'x', sign: 1, count: 1 },
            { type: '1', sign: 1, count: 3 },
          ],
          rightTiles: [{ type: '1', sign: 1, count: 5 }],
          symbolicResult: 'x + 3 = 5  →  x = 2',
          highlightNote: 'Tambahkan −3 pada kedua sisi, lalu hilangkan zero pairs!',
        },
        summary: 'Operasi pada satu sisi saja akan merusak kesetaraan persamaan.',
        checkQuestion: {
          prompt: 'Untuk menyelesaikan x + 3 = 5 dengan ubin aljabar, langkah tepat yang menjaga kesetaraan adalah...',
          options: [
            'Menambah −3 di sisi kiri saja',
            'Menambah −3 di sisi kiri dan −3 di sisi kanan',
            'Menambah +3 di sisi kanan saja',
            'Menghapus ubin x di sisi kiri',
          ],
          correctIndex: 1,
          explanation:
            'Menambahkan −3 pada kedua sisi menjaga keseimbangan persamaan hingga menjadi x = 2.',
        },
      },
    ],
  },
];

export const MISSIONS_CONFIG: Mission[] = [
  {
    id: 'misi-dasar-1',
    levelId: 'level-1',
    order: 1,
    title: 'Membangun Ekspresi Pertama',
    topic: 'Dasar Ubin Aljabar',
    mode: 'explore',
    instructions: 'Susunlah model ubin untuk ekspresi aljabar 2x + 3 di workspace.',
    lkpdPrompt: 'Catat di LKPD: berapa banyak ubin +x dan ubin +1 yang kamu gunakan?',
    initialTiles: [],
    validationRule: {
      type: 'exact_tiles',
      target: { x2: 0, x: 2, constant: 3 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Gunakan ubin persegi panjang +x untuk suku x dan ubin persegi kecil +1 untuk konstanta.',
      'Kamu membutuhkan 2 buah ubin +x dan 3 buah ubin +1.',
    ],
    rewardXp: 80,
  },
  {
    id: 'misi-dasar-2',
    levelId: 'level-1',
    order: 2,
    title: 'Menyusun Suku Kuadrat & Negatif',
    topic: 'Dasar Ubin Aljabar',
    mode: 'explore',
    instructions: 'Susunlah ekspresi x² − 2x + 1 menggunakan kombinasi ubin positif dan negatif.',
    lkpdPrompt: 'Amati di LKPD: mengapa ubin −x berwarna berbeda dan memiliki tanda minus?',
    initialTiles: [],
    validationRule: {
      type: 'exact_tiles',
      target: { x2: 1, x: -2, constant: 1 },
      requireNoZeroPairs: true,
    },
    hints: [
      'x² berarti 1 ubin +x² (persegi besar).',
      '−2x berarti 2 ubin −x, dan +1 berarti 1 ubin +1.',
    ],
    rewardXp: 100,
  },
  {
    id: 'misi-suku-1',
    levelId: 'level-2',
    order: 3,
    title: 'Gabungkan Suku Sejenis',
    topic: 'Suku Sejenis',
    mode: 'explore',
    instructions:
      'Di papan sudah tersedia ubin untuk 2x + 3x + 2 + 4. Kelompokkan suku sejenis dan tambahkan/rapikan hingga terlihat bentuk sederhananya (5x + 6)!',
    lkpdPrompt: 'Tuliskan di LKPD mengapa 5x dan 6 tidak bisa digabung menjadi 11x.',
    initialTiles: [
      { type: 'x', sign: 1, count: 2 },
      { type: '1', sign: 1, count: 2 },
      { type: 'x', sign: 1, count: 3 },
      { type: '1', sign: 1, count: 4 },
    ],
    validationRule: {
      type: 'equivalent_simplified',
      target: { x2: 0, x: 5, constant: 6 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Gunakan tombol "Kelompokkan Suku Sejenis" untuk melihat ubin x dan ubin 1 berkumpul sesuai jenisnya.',
      'Hitung total ubin +x (2 + 3 = 5x) dan total ubin +1 (2 + 4 = 6), lalu klik Periksa Jawaban.',
    ],
    rewardXp: 110,
  },
  {
    id: 'misi-suku-2',
    levelId: 'level-2',
    order: 4,
    title: 'Menyederhanakan Campuran Suku',
    topic: 'Suku Sejenis',
    mode: 'explore',
    instructions:
      'Tambahkan ubin secukupnya pada ekspresi 2x + 1 yang sudah ada agar keseluruhan papan menjadi 4x + 5.',
    lkpdPrompt: 'Ubin apa saja yang kamu tambahkan pada suku x dan konstanta?',
    initialTiles: [
      { type: 'x', sign: 1, count: 2 },
      { type: '1', sign: 1, count: 1 },
    ],
    validationRule: {
      type: 'exact_tiles',
      target: { x2: 0, x: 4, constant: 5 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Saat ini sudah ada 2x + 1. Untuk mencapai 4x, kamu perlu menambah 2 ubin +x.',
      'Untuk mencapai +5 dari +1, tambahkan 4 ubin +1.',
    ],
    rewardXp: 120,
  },
  {
    id: 'misi-zero-1',
    levelId: 'level-3',
    order: 5,
    title: 'Menemukan Zero Pair',
    topic: 'Zero Pairs',
    mode: 'explore',
    instructions:
      'Di papan terdapat 3 ubin +x, 2 ubin −x, dan 4 ubin +1. Hilangkan semua zero pair yang terbentuk hingga ekspresi paling sederhana tersisa!',
    lkpdPrompt: 'Catat di LKPD berapa pasang zero pair yang berhasil kamu hilangkan.',
    initialTiles: [
      { type: 'x', sign: 1, count: 3 },
      { type: 'x', sign: -1, count: 2 },
      { type: '1', sign: 1, count: 4 },
    ],
    validationRule: {
      type: 'equivalent_simplified',
      target: { x2: 0, x: 1, constant: 4 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Setiap 1 ubin +x berpasangan dengan 1 ubin −x membentuk 0.',
      'Klik tombol "Pasangkan Zero Pair" untuk meniadakan 2 pasang (+x dan −x) sehingga tersisa x + 4.',
    ],
    rewardXp: 130,
  },
  {
    id: 'misi-zero-2',
    levelId: 'level-3',
    order: 6,
    title: 'Sederhanakan dengan Lawan Tanda',
    topic: 'Zero Pairs',
    mode: 'explore',
    instructions:
      'Sederhanakan ekspresi (2x + 3) − (x + 1) dengan menambahkan ubin lawan (−x dan −1) lalu hilangkan zero pairs hingga tersisa bentuk paling sederhana.',
    lkpdPrompt: 'Jelaskan di LKPD mengapa mengurangi (x + 1) sama dengan menambah −x dan −1.',
    initialTiles: [
      { type: 'x', sign: 1, count: 2 },
      { type: '1', sign: 1, count: 3 },
    ],
    validationRule: {
      type: 'equivalent_simplified',
      target: { x2: 0, x: 1, constant: 2 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Mulailah dengan menambahkan 1 ubin −x dan 1 ubin −1 sebagai lawan dari (x + 1).',
      'Setelah itu klik "Pasangkan Zero Pair" sehingga tersisa x + 2.',
    ],
    rewardXp: 140,
  },
  {
    id: 'misi-persamaan-1',
    levelId: 'level-4',
    order: 7,
    title: 'Menjaga Keseimbangan: x + 3 = 5',
    topic: 'Keseimbangan Persamaan',
    mode: 'equation',
    instructions:
      'Selesaikan persamaan x + 3 = 5 menjadi x = 2 dengan menambahkan ubin negatif yang sama pada KEDUA sisi persamaan, lalu sederhanakan zero pairs!',
    lkpdPrompt: 'Catat di LKPD operasi apa yang diterapkan pada sisi kiri dan sisi kanan.',
    initialEquation: {
      left: [
        { type: 'x', sign: 1, count: 1 },
        { type: '1', sign: 1, count: 3 },
      ],
      right: [{ type: '1', sign: 1, count: 5 }],
    },
    validationRule: {
      type: 'equation_solve',
      target: { x2: 0, x: 1, constant: 2 },
      targetVariableValue: 2,
    },
    hints: [
      'Untuk menghilangkan +3 di sisi kiri, tambahkan 3 buah ubin −1 pada KEDUA sisi persamaan.',
      'Setelah kedua sisi menerima −3, klik "Sederhanakan Zero Pair" hingga tersisa x = 2.',
    ],
    rewardXp: 160,
  },
  {
    id: 'misi-persamaan-2',
    levelId: 'level-4',
    order: 8,
    title: 'Persamaan dengan Negatif: x − 2 = 4',
    topic: 'Keseimbangan Persamaan',
    mode: 'equation',
    instructions:
      'Selesaikan persamaan x − 2 = 4 agar diperoleh nilai x. Tambahkan ubin yang tepat pada kedua sisi dan bersihkan zero pair!',
    lkpdPrompt: 'Bandingkan dengan misi sebelumnya: mengapa kali ini kita menambah ubin +1 pada kedua sisi?',
    initialEquation: {
      left: [
        { type: 'x', sign: 1, count: 1 },
        { type: '1', sign: -1, count: 2 },
      ],
      right: [{ type: '1', sign: 1, count: 4 }],
    },
    validationRule: {
      type: 'equation_solve',
      target: { x2: 0, x: 1, constant: 6 },
      targetVariableValue: 6,
    },
    hints: [
      'Sisi kiri memiliki 2 ubin −1. Lawan dari −2 adalah +2.',
      'Tambahkan 2 ubin +1 pada kedua sisi, lalu klik "Sederhanakan Zero Pair" sehingga x = 6.',
    ],
    rewardXp: 180,
  },
];

export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  {
    id: 'q-dasar-1',
    topic: 'Dasar Ubin Aljabar',
    unit: 'formatif_dasar',
    type: 'interpret_tiles',
    prompt: 'Perhatikan susunan Algebra Tiles di bawah ini. Ekspresi aljabar manakah yang paling tepat?',
    visualTiles: [
      { type: 'x2', sign: 1, count: 1 },
      { type: 'x', sign: -1, count: 2 },
      { type: '1', sign: 1, count: 3 },
    ],
    options: ['x² + 2x + 3', 'x² − 2x + 3', '2x² − x + 3', 'x² − 2x − 3'],
    correctOptionIndex: 1,
    explanation:
      'Terdapat 1 ubin +x² (persegi besar), 2 ubin −x (persegi panjang negatif), dan 3 ubin +1 (persegi kecil positif), sehingga ekspresinya adalah x² − 2x + 3.',
    recommendedTopicId: 'topic-dasar',
  },
  {
    id: 'q-dasar-2',
    topic: 'Dasar Ubin Aljabar',
    unit: 'formatif_dasar',
    type: 'build_tiles',
    prompt: 'Susunlah Algebra Tiles di papan mini berikut untuk membentuk ekspresi 3x − 2.',
    expectedTarget: { x2: 0, x: 3, constant: -2, requireNoZeroPairs: true },
    explanation: '3x dibentuk dari 3 ubin +x dan −2 dibentuk dari 2 ubin −1.',
    recommendedTopicId: 'topic-dasar',
  },
  {
    id: 'q-suku-1',
    topic: 'Suku Sejenis',
    unit: 'formatif_suku',
    type: 'multiple_choice',
    prompt: 'Hasil penyederhanaan dari 2x + 3x + 2 + 4 adalah...',
    options: ['11x', '5x + 6', '6x + 5', '5x² + 6'],
    correctOptionIndex: 1,
    explanation:
      'Suku sejenis digabungkan sesuai jenisnya: 2x + 3x = 5x dan 2 + 4 = 6. Karena x dan konstanta berbeda jenis, hasilnya tetap 5x + 6.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'q-suku-2',
    topic: 'Suku Sejenis',
    unit: 'formatif_suku',
    type: 'multiple_choice',
    prompt: 'Manakah pernyataan yang BENAR tentang ekspresi 2x + 3?',
    options: [
      'Dapat disederhanakan menjadi 5x karena 2 + 3 = 5',
      'Dapat disederhanakan menjadi 5',
      'Tidak dapat digabungkan karena ubin x dan ubin 1 bukan suku sejenis',
      'Sama dengan 6x',
    ],
    correctOptionIndex: 2,
    explanation:
      'Ubin x mewakili suku linear sedangkan ubin 1 mewakili konstanta. Keduanya bukan suku sejenis sehingga tidak dapat digabung.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'q-zero-1',
    topic: 'Zero Pairs',
    unit: 'formatif_zeropair',
    type: 'interpret_tiles',
    prompt: 'Setelah semua zero pair pada model ubin di bawah ditiadakan, ekspresi apa yang tersisa?',
    visualTiles: [
      { type: 'x', sign: 1, count: 4 },
      { type: 'x', sign: -1, count: 2 },
      { type: '1', sign: 1, count: 1 },
      { type: '1', sign: -1, count: 3 },
    ],
    options: ['6x + 4', '2x − 2', '2x + 2', '−2x + 2'],
    correctOptionIndex: 1,
    explanation:
      '4 ubin +x dengan 2 ubin −x membentuk 2 zero pair (tersisa 2x). 1 ubin +1 dengan 3 ubin −1 membentuk 1 zero pair (tersisa −2). Total menjadi 2x − 2.',
    recommendedTopicId: 'topic-zero-pair',
  },
  {
    id: 'q-zero-2',
    topic: 'Zero Pairs',
    unit: 'formatif_zeropair',
    type: 'build_tiles',
    prompt: 'Bentuklah hasil penyederhanaan dari (3x + 2) + (−x − 5) tanpa menyisakan zero pair.',
    expectedTarget: { x2: 0, x: 2, constant: -3, requireNoZeroPairs: true },
    explanation:
      '3x + (−x) menyisakan 2x, dan +2 + (−5) menyisakan −3. Jadi hasil akhirnya adalah 2x − 3 (2 ubin +x dan 3 ubin −1).',
    recommendedTopicId: 'topic-zero-pair',
  },
  {
    id: 'q-persamaan-1',
    topic: 'Keseimbangan Persamaan',
    unit: 'formatif_persamaan',
    type: 'multiple_choice',
    prompt: 'Pada papan persamaan x + 4 = 9, siswa menambahkan 4 ubin −1 hanya di sisi kiri. Apa dampaknya?',
    options: [
      'Persamaan tetap setara dan menjadi x = 9',
      'Kesetaraan berubah karena operasi tidak dilakukan di kedua sisi',
      'Nilai x otomatis menjadi 5',
      'Ubin di sisi kanan ikut berkurang otomatis',
    ],
    correctOptionIndex: 1,
    explanation:
      'Dalam persamaan, setiap operasi yang dilakukan pada satu sisi harus diterapkan juga pada sisi lainnya agar kesetaraan tetap terjaga.',
    recommendedTopicId: 'topic-persamaan',
  },
  {
    id: 'q-persamaan-2',
    topic: 'Keseimbangan Persamaan',
    unit: 'formatif_persamaan',
    type: 'multiple_choice',
    prompt: 'Jika persamaan x − 3 = 4 diselesaikan dengan menambahkan +3 pada kedua sisi, hasil akhirnya adalah...',
    options: ['x = 1', 'x = 7', 'x = −7', 'x = 12'],
    correctOptionIndex: 1,
    explanation:
      'Di sisi kiri, −3 dan +3 membentuk 3 zero pair sehingga tersisa x. Di sisi kanan, 4 + 3 = 7. Jadi x = 7.',
    recommendedTopicId: 'topic-persamaan',
  },
];

export const QUIZ_SUITES = [
  {
    id: 'evaluasi_akhir',
    title: 'Evaluasi Lengkap Aljabar',
    description: 'Menguji penguasaan dasar ubin, suku sejenis, zero pairs, dan kesetaraan persamaan.',
    units: ['formatif_dasar', 'formatif_suku', 'formatif_zeropair', 'formatif_persamaan'] as const,
  },
  {
    id: 'formatif_dasar',
    title: 'Kuis Topik 1: Dasar Ubin Aljabar',
    description: 'Fokus pada pengenalan ubin x², x, 1 dan tanda positif/negatif.',
    units: ['formatif_dasar'] as const,
  },
  {
    id: 'formatif_suku',
    title: 'Kuis Topik 2: Suku Sejenis',
    description: 'Menggabungkan suku sejenis dan membedakan suku yang tidak sejenis.',
    units: ['formatif_suku'] as const,
  },
  {
    id: 'formatif_zeropair',
    title: 'Kuis Topik 3: Zero Pairs',
    description: 'Penyederhanaan ekspresi dengan pasangan nol dan penjumlahan lawan.',
    units: ['formatif_zeropair'] as const,
  },
  {
    id: 'formatif_persamaan',
    title: 'Kuis Topik 4: Keseimbangan Persamaan',
    description: 'Menjaga kesetaraan kedua sisi untuk menemukan nilai variabel.',
    units: ['formatif_persamaan'] as const,
  },
];
