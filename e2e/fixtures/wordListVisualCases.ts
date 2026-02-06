import type { SeedWord } from '../helpers/dbSeed';

interface WordListVisualCase {
    name: string;
    scopeId: string;
    words: SeedWord[];
}

const createWord = (base: Omit<SeedWord, 'question' | 'answer'>): SeedWord => ({
    ...base,
    question: base.rawMeaning,
    answer: base.rawWord
});

export const WORD_LIST_VISUAL_CASES: WordListVisualCase[] = [
    {
        name: 'ことわざ',
        scopeId: '42A-02',
        words: [
            createWord({
                page: 12,
                numberInPage: 1,
                category: 'ことわざ',
                rawWord: '犬も歩けば棒に当たる',
                yomigana: 'いぬもあるけばぼうにあたる',
                rawMeaning: '行動するとよい機会に出会うこともある',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }),
            createWord({
                page: 13,
                numberInPage: 2,
                category: 'ことわざ',
                rawWord: '転ばぬ先の杖',
                yomigana: 'ころばぬさきのつえ',
                rawMeaning: '失敗する前に準備しておくことが大切だということ',
                isLearnedCategory: true,
                isLearnedMeaning: false
            }),
            createWord({
                page: 16,
                numberInPage: 8,
                category: 'ことわざ',
                rawWord: '急がば回れ',
                yomigana: 'いそがばまわれ',
                rawMeaning: '急ぐときほど安全で確実な方法を選ぶべきだというたとえ',
                isLearnedCategory: true,
                isLearnedMeaning: true
            })
        ]
    },
    {
        name: '慣用句',
        scopeId: '42A-05',
        words: [
            createWord({
                page: 50,
                numberInPage: 1,
                category: '慣用句',
                rawWord: '頭が痛い',
                yomigana: 'あたまがいたい',
                rawMeaning: '悩みごとが多くて困っている',
                exampleSentence: '対応事項が多くて頭が痛い。',
                exampleSentenceYomigana: 'たいおうじこうがおおくてあたまがいたい。',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }),
            createWord({
                page: 51,
                numberInPage: 4,
                category: '慣用句',
                rawWord: '腰が重い',
                yomigana: 'こしがおもい',
                rawMeaning: 'なかなか行動を起こさない',
                exampleSentence: '計画を立てても腰が重く、開始までに時間がかかる。',
                exampleSentenceYomigana: 'けいかくをたててもこしがおもく、かいしまでにじかんがかかる。',
                isLearnedCategory: true,
                isLearnedMeaning: false
            }),
            createWord({
                page: 52,
                numberInPage: 9,
                category: '慣用句',
                rawWord: '耳が痛い',
                yomigana: 'みみがいたい',
                rawMeaning: '自分に当てはまっていて聞くのがつらい',
                exampleSentence: '生活習慣の指摘は耳が痛い。',
                exampleSentenceYomigana: 'せいかつしゅうかんのしてきはみみがいたい。',
                isLearnedCategory: true,
                isLearnedMeaning: true
            })
        ]
    },
    {
        name: '類義語',
        scopeId: '42A-09',
        words: [
            createWord({
                page: 88,
                numberInPage: 1,
                category: '類義語',
                rawWord: '不足',
                yomigana: 'ふそく',
                rawMeaning: '足りないこと',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '不足',
                        yomigana: 'ふそく',
                        exampleSentenceYomigana: 'いすのかずが＿＿している。',
                        exampleSentence: 'いすの数が＿＿している。'
                    },
                    {
                        rawWord: '欠乏',
                        yomigana: 'けつぼう',
                        exampleSentenceYomigana: 'しげんが＿＿している。',
                        exampleSentence: '資源が＿＿している。'
                    }
                ]
            }),
            createWord({
                page: 88,
                numberInPage: 5,
                category: '類義語',
                rawWord: '完全',
                yomigana: 'かんぜん',
                rawMeaning: '欠けたところがないこと',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '完全',
                        yomigana: 'かんぜん',
                        exampleSentenceYomigana: '＿＿なけいかくをさくせいする。',
                        exampleSentence: '＿＿な計画を作成する。'
                    },
                    {
                        rawWord: '完璧',
                        yomigana: 'かんぺき',
                        exampleSentenceYomigana: '＿＿なじゅんびでほんばんにのぞむ。',
                        exampleSentence: '＿＿な準備で本番に臨む。'
                    }
                ]
            }),
            createWord({
                page: 89,
                numberInPage: 7,
                category: '類義語',
                rawWord: '改善',
                yomigana: 'かいぜん',
                rawMeaning: 'よりよく改めること',
                isLearnedCategory: true,
                isLearnedMeaning: true,
                groupMembers: [
                    {
                        rawWord: '改善',
                        yomigana: 'かいぜん',
                        exampleSentenceYomigana: 'うんようのながれを＿＿する。',
                        exampleSentence: '運用の流れを＿＿する。'
                    },
                    {
                        rawWord: '改良',
                        yomigana: 'かいりょう',
                        exampleSentenceYomigana: 'せいひんを＿＿してつかいやすくする。',
                        exampleSentence: '製品を＿＿して使いやすくする。'
                    }
                ]
            })
        ]
    },
    {
        name: '対義語',
        scopeId: '42A-11',
        words: [
            createWord({
                page: 92,
                numberInPage: 1,
                category: '対義語',
                rawWord: '増加',
                yomigana: 'ぞうか',
                rawMeaning: '数量が増えること',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '増加',
                        yomigana: 'ぞうか',
                        exampleSentenceYomigana: 'りようしゃが＿＿した。',
                        exampleSentence: '利用者が＿＿した。'
                    },
                    {
                        rawWord: '減少',
                        yomigana: 'げんしょう',
                        exampleSentenceYomigana: 'りようしゃが＿＿した。',
                        exampleSentence: '利用者が＿＿した。'
                    }
                ]
            }),
            createWord({
                page: 93,
                numberInPage: 3,
                category: '対義語',
                rawWord: '賛成',
                yomigana: 'さんせい',
                rawMeaning: '意見に同意すること',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '賛成',
                        yomigana: 'さんせい',
                        exampleSentenceYomigana: 'ていあんに＿＿する。',
                        exampleSentence: '提案に＿＿する。'
                    },
                    {
                        rawWord: '反対',
                        yomigana: 'はんたい',
                        exampleSentenceYomigana: 'りゆうをしめして＿＿する。',
                        exampleSentence: '理由を示して＿＿する。'
                    }
                ]
            }),
            createWord({
                page: 93,
                numberInPage: 9,
                category: '対義語',
                rawWord: '開始',
                yomigana: 'かいし',
                rawMeaning: '物事を始めること',
                isLearnedCategory: true,
                isLearnedMeaning: true,
                groupMembers: [
                    {
                        rawWord: '開始',
                        yomigana: 'かいし',
                        exampleSentenceYomigana: 'かいぎを＿＿する。',
                        exampleSentence: '会議を＿＿する。'
                    },
                    {
                        rawWord: '終了',
                        yomigana: 'しゅうりょう',
                        exampleSentenceYomigana: 'よていどおり＿＿する。',
                        exampleSentence: '予定通り＿＿する。'
                    }
                ]
            })
        ]
    },
    {
        name: '四字熟語',
        scopeId: '42A-13',
        words: [
            createWord({
                page: 103,
                numberInPage: 1,
                category: '四字熟語',
                rawWord: '一期一会',
                yomigana: 'いちごいちえ',
                rawMeaning: '一生に一度の機会として大切にすること',
                exampleSentence: '出会いを一期一会の気持ちで大切にする。',
                exampleSentenceYomigana: 'であいをいちごいちえのきもちでたいせつにする。',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }),
            createWord({
                page: 104,
                numberInPage: 5,
                category: '四字熟語',
                rawWord: '試行錯誤',
                yomigana: 'しこうさくご',
                rawMeaning: '何度も試しながら改善していくこと',
                exampleSentence: '新しい設計は試行錯誤を重ねて完成した。',
                exampleSentenceYomigana: 'あたらしいせっけいはしこうさくごをかさねてかんせいした。',
                isLearnedCategory: true,
                isLearnedMeaning: false
            }),
            createWord({
                page: 106,
                numberInPage: 11,
                category: '四字熟語',
                rawWord: '臨機応変',
                yomigana: 'りんきおうへん',
                rawMeaning: '状況に応じて適切に対応すること',
                exampleSentence: '現場では臨機応変な判断が求められる。',
                exampleSentenceYomigana: 'げんばではりんきおうへんなはんだんがもとめられる。',
                isLearnedCategory: true,
                isLearnedMeaning: true
            })
        ]
    },
    {
        name: '三字熟語',
        scopeId: '42A-15',
        words: [
            createWord({
                page: 119,
                numberInPage: 1,
                category: '三字熟語',
                rawWord: '初対面',
                yomigana: 'しょたいめん',
                rawMeaning: '初めて会うこと',
                exampleSentence: '初対面でも丁寧にあいさつする。',
                exampleSentenceYomigana: 'しょたいめんでもていねいにあいさつする。',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }),
            createWord({
                page: 120,
                numberInPage: 4,
                category: '三字熟語',
                rawWord: '安全策',
                yomigana: 'あんぜんさく',
                rawMeaning: 'リスクを抑えるための方法',
                exampleSentence: '納期優先ではなく安全策を選んで進める。',
                exampleSentenceYomigana: 'のうきゆうせんではなくあんぜんさくをえらんですすめる。',
                isLearnedCategory: true,
                isLearnedMeaning: false
            }),
            createWord({
                page: 121,
                numberInPage: 9,
                category: '三字熟語',
                rawWord: '最終案',
                yomigana: 'さいしゅうあん',
                rawMeaning: '検討の末に決まった最終の案',
                exampleSentence: '各案を比較し、最終案を会議で承認した。',
                exampleSentenceYomigana: 'かくあんをひかくし、さいしゅうあんをかいぎでしょうにんした。',
                isLearnedCategory: true,
                isLearnedMeaning: true
            })
        ]
    },
    {
        name: '同音異義語',
        scopeId: '42A-17',
        words: [
            createWord({
                page: 144,
                numberInPage: 1,
                category: '同音異義語',
                rawWord: '委員',
                yomigana: 'いいん',
                rawMeaning: '同じ読みで意味の異なる語',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '委員',
                        yomigana: 'いいん',
                        exampleSentenceYomigana: 'がっきゅう＿＿にせんしゅつされた。',
                        exampleSentence: '学級＿＿に選出された。'
                    },
                    {
                        rawWord: '医院',
                        yomigana: 'いいん',
                        exampleSentenceYomigana: 'えきまえの＿＿でしんさつをうける。',
                        exampleSentence: '駅前の＿＿で診察を受ける。'
                    },
                    {
                        rawWord: '遺印',
                        yomigana: 'いいん',
                        exampleSentenceYomigana: 'しりょうに＿＿がのこっていた。',
                        exampleSentence: '資料に＿＿が残っていた。'
                    }
                ]
            }),
            createWord({
                page: 145,
                numberInPage: 5,
                category: '同音異義語',
                rawWord: 'こうしょう',
                yomigana: 'こうしょう',
                rawMeaning: '同じ音で字と意味が異なる語',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '交渉',
                        yomigana: 'こうしょう',
                        exampleSentenceYomigana: 'じょうけんを＿＿してきめる。',
                        exampleSentence: '条件を＿＿して決める。'
                    },
                    {
                        rawWord: '高尚',
                        yomigana: 'こうしょう',
                        exampleSentenceYomigana: '＿＿なしゅみをもつ。',
                        exampleSentence: '＿＿な趣味を持つ。'
                    }
                ]
            }),
            createWord({
                page: 146,
                numberInPage: 10,
                category: '同音異義語',
                rawWord: 'かいとう',
                yomigana: 'かいとう',
                rawMeaning: '文脈で意味を見分ける必要がある語',
                isLearnedCategory: true,
                isLearnedMeaning: true,
                groupMembers: [
                    {
                        rawWord: '回答',
                        yomigana: 'かいとう',
                        exampleSentenceYomigana: 'しつもんに＿＿する。',
                        exampleSentence: '質問に＿＿する。'
                    },
                    {
                        rawWord: '解凍',
                        yomigana: 'かいとう',
                        exampleSentenceYomigana: 'れいとうしょくひんを＿＿する。',
                        exampleSentence: '冷凍食品を＿＿する。'
                    }
                ]
            })
        ]
    },
    {
        name: '同訓異字',
        scopeId: '42A-19',
        words: [
            createWord({
                page: 158,
                numberInPage: 1,
                category: '同訓異字',
                rawWord: '合う',
                yomigana: 'あう',
                rawMeaning: '同じ訓で字が異なる語',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '合う',
                        yomigana: 'あう',
                        exampleSentenceYomigana: 'ともだちとじかんが＿＿。',
                        exampleSentence: '友だちと時間が＿＿。'
                    },
                    {
                        rawWord: '会う',
                        yomigana: 'あう',
                        exampleSentenceYomigana: 'ほうかごにせんせいに＿＿。',
                        exampleSentence: '放課後に先生に＿＿。'
                    },
                    {
                        rawWord: '遭う',
                        yomigana: 'あう',
                        exampleSentenceYomigana: 'おおあめに＿＿。',
                        exampleSentence: '大雨に＿＿。'
                    }
                ]
            }),
            createWord({
                page: 159,
                numberInPage: 6,
                category: '同訓異字',
                rawWord: 'はかる',
                yomigana: 'はかる',
                rawMeaning: '文脈で適切な漢字を選ぶ語',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    {
                        rawWord: '計る',
                        yomigana: 'はかる',
                        exampleSentenceYomigana: 'じかんを＿＿。',
                        exampleSentence: '時間を＿＿。'
                    },
                    {
                        rawWord: '測る',
                        yomigana: 'はかる',
                        exampleSentenceYomigana: 'きょりを＿＿。',
                        exampleSentence: '距離を＿＿。'
                    }
                ]
            }),
            createWord({
                page: 159,
                numberInPage: 11,
                category: '同訓異字',
                rawWord: 'おさめる',
                yomigana: 'おさめる',
                rawMeaning: '訓は同じだが字が異なる語',
                isLearnedCategory: true,
                isLearnedMeaning: true,
                groupMembers: [
                    {
                        rawWord: '納める',
                        yomigana: 'おさめる',
                        exampleSentenceYomigana: 'ぜいきを＿＿。',
                        exampleSentence: '税金を＿＿。'
                    },
                    {
                        rawWord: '収める',
                        yomigana: 'おさめる',
                        exampleSentenceYomigana: 'どうがを＿＿。',
                        exampleSentence: '動画を＿＿。'
                    }
                ]
            })
        ]
    },
    {
        name: '似た意味のことわざ',
        scopeId: '42A-22',
        words: [
            createWord({
                page: 34,
                numberInPage: 1,
                category: '似た意味のことわざ',
                rawWord: '転ばぬ先の杖',
                yomigana: 'ころばぬさきのつえ',
                rawMeaning: '前もって準備しておくことの大切さ',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '転ばぬ先の杖', yomigana: 'ころばぬさきのつえ' },
                    { rawWord: '備えあれば憂いなし', yomigana: 'そなえあればうれいなし' }
                ]
            }),
            createWord({
                page: 35,
                numberInPage: 5,
                category: '似た意味のことわざ',
                rawWord: '塵も積もれば山となる',
                yomigana: 'ちりもつもればやまとなる',
                rawMeaning: '小さなことでも積み重なれば大きな成果になる',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '塵も積もれば山となる', yomigana: 'ちりもつもればやまとなる' },
                    { rawWord: '継続は力なり', yomigana: 'けいぞくはちからなり' },
                    { rawWord: '石の上にも三年', yomigana: 'いしのうえにもさんねん' }
                ]
            }),
            createWord({
                page: 36,
                numberInPage: 8,
                category: '似た意味のことわざ',
                rawWord: '案ずるより産むが易し',
                yomigana: 'あんずるよりうむがやすし',
                rawMeaning: '心配するより実行したほうがうまくいくことがある',
                isLearnedCategory: true,
                isLearnedMeaning: true,
                groupMembers: [
                    { rawWord: '案ずるより産むが易し', yomigana: 'あんずるよりうむがやすし' },
                    { rawWord: '思い立ったが吉日', yomigana: 'おもいたったがきちじつ' }
                ]
            })
        ]
    },
    {
        name: '対になることわざ',
        scopeId: '42A-22-2',
        words: [
            createWord({
                page: 37,
                numberInPage: 1,
                category: '対になることわざ',
                rawWord: '上を向いて歩こう',
                yomigana: 'うえをむいてあるこう',
                rawMeaning: '対として覚えることわざ',
                isLearnedCategory: false,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '上を向いて歩こう', yomigana: 'うえをむいてあるこう', customLabel: '上' },
                    { rawWord: '下を向いて語ろう', yomigana: 'したをむいてかたろう', customLabel: '下' }
                ]
            }),
            createWord({
                page: 38,
                numberInPage: 3,
                category: '対になることわざ',
                rawWord: '善は急げ',
                yomigana: 'ぜんはいそげ',
                rawMeaning: 'よいことはすぐに実行すべきだという意味の対比',
                isLearnedCategory: true,
                isLearnedMeaning: false,
                groupMembers: [
                    { rawWord: '善は急げ', yomigana: 'ぜんはいそげ', customLabel: '善' },
                    { rawWord: '悪は延ばせ', yomigana: 'あくはのばせ', customLabel: '悪' }
                ]
            }),
            createWord({
                page: 39,
                numberInPage: 7,
                category: '対になることわざ',
                rawWord: '攻めるが勝ち',
                yomigana: 'せめるがかち',
                rawMeaning: '対になる句の関係を区別して覚える',
                isLearnedCategory: true,
                isLearnedMeaning: true,
                groupMembers: [
                    { rawWord: '攻めるが勝ち', yomigana: 'せめるがかち', customLabel: '攻' },
                    { rawWord: '守るが勝ち', yomigana: 'まもるがかち', customLabel: '守' }
                ]
            })
        ]
    },
    {
        name: '上下で対となる熟語',
        scopeId: '42A-29',
        words: [
            createWord({
                page: 101,
                numberInPage: 1,
                category: '上下で対となる熟語',
                rawWord: '起承',
                yomigana: 'きしょう',
                rawMeaning: '文の構成の前半',
                exampleSentence: '文章は＿＿転結で構成される。',
                exampleSentenceYomigana: 'ぶんしょうは＿＿てんけつでこうせいされる。',
                isLearnedCategory: false,
                isLearnedMeaning: false
            }),
            createWord({
                page: 101,
                numberInPage: 4,
                category: '上下で対となる熟語',
                rawWord: '前半',
                yomigana: 'ぜんはん',
                rawMeaning: '対になる語の上側',
                exampleSentence: '会議の＿＿で論点を整理する。',
                exampleSentenceYomigana: 'かいぎの＿＿でろんてんをせいりする。',
                isLearnedCategory: true,
                isLearnedMeaning: false
            }),
            createWord({
                page: 102,
                numberInPage: 8,
                category: '上下で対となる熟語',
                rawWord: '前進',
                yomigana: 'ぜんしん',
                rawMeaning: '対になる語の上側',
                exampleSentence: '状況を見ながら一歩ずつ＿＿する。',
                exampleSentenceYomigana: 'じょうきょうをみながらいっぽずつ＿＿する。',
                isLearnedCategory: true,
                isLearnedMeaning: true
            })
        ]
    }
];

