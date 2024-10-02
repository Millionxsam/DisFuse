module.exports = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'main_token',
        id: 'Z;xE[:}:#_^a$:;*t/kP',
        x: 0,
        y: 98,
        inputs: {
          token: {
            block: {
              type: 'main_env',
              id: '7k$sO4ZUAAekQpnT^Ym]',
              inputs: {
                value: {
                  block: {
                    type: 'text',
                    id: 'Lj6q*.PTRRp]Ah~xerlX',
                    fields: { TEXT: 'token' },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: 'main_ready',
        id: '9Mf#BNexvLA+B;OTxZ,s',
        x: 0,
        y: 212,
        inputs: {
          event: {
            block: {
              type: 'slash_createcontainer',
              id: 'a0hfpY2t?kfPs.ztT6_I',
              inputs: {
                guild: {
                  block: {
                    type: 'text',
                    id: 'r{:pD?Xj$6P:0s3m@{]_',
                    fields: { TEXT: '' },
                  },
                },
                commands: {
                  block: {
                    type: 'slash_create',
                    id: 'ygvT0iJ*#rx)B[V0W-dt',
                    inputs: {
                      name: {
                        shadow: {
                          type: 'text',
                          id: '73mnCrh#_-Hh#%}f4LQj',
                          fields: { TEXT: 'balance' },
                        },
                      },
                      dsc: {
                        shadow: {
                          type: 'text',
                          id: 'P)4wKU,Bgh;]{Pw8M?2F',
                          fields: { TEXT: "Get an user's balance" },
                        },
                      },
                      nsfw: {
                        shadow: {
                          type: 'logic_boolean',
                          id: 'U@1#HgptSCFJErnDsSa9',
                          fields: { BOOL: 'FALSE' },
                        },
                      },
                      dm: {
                        shadow: {
                          type: 'logic_boolean',
                          id: ')5yG2dcKW,W-P.sLUYYt',
                          fields: { BOOL: 'TRUE' },
                        },
                      },
                      options: {
                        block: {
                          type: 'slash_addoption',
                          id: '3pK`OE!?A}ObF#SyVp}A',
                          fields: { type: '6' },
                          inputs: {
                            name: {
                              block: {
                                type: 'text',
                                id: ';+1B/R$Gl}YG,iDYz`z7',
                                fields: { TEXT: 'user' },
                              },
                            },
                            dsc: {
                              block: {
                                type: 'text',
                                id: 'ru[^7q!oo3pciz4,.wf#',
                                fields: {
                                  TEXT: 'The user to get their balance',
                                },
                              },
                            },
                            required: {
                              block: {
                                type: 'logic_boolean',
                                id: 'W|3BfAFE6)e-]txLzP(3',
                                fields: { BOOL: 'FALSE' },
                              },
                            },
                          },
                        },
                      },
                    },
                    next: {
                      block: {
                        type: 'slash_create',
                        id: ']Lr^o{hv/|hsJPD)C5{w',
                        inputs: {
                          name: {
                            shadow: {
                              type: 'text',
                              id: '}c8eV+.$h;9=9Xa(,jy|',
                              fields: { TEXT: 'beg' },
                            },
                          },
                          dsc: {
                            shadow: {
                              type: 'text',
                              id: ']aqu[8E+/(+X(`?_feLU',
                              fields: { TEXT: 'Beg for some money' },
                            },
                          },
                          nsfw: {
                            shadow: {
                              type: 'logic_boolean',
                              id: 'q7HE8urf/m7tu(C`nW~%',
                              fields: { BOOL: 'FALSE' },
                            },
                          },
                          dm: {
                            shadow: {
                              type: 'logic_boolean',
                              id: 'hj:h?tl$K/3sw}#{H]$x',
                              fields: { BOOL: 'TRUE' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: 'slash_received',
        id: '}*e]QKa;-PzWh@-7|w[D',
        x: 0,
        y: 1350,
        inputs: {
          event: {
            block: {
              type: 'variables_set',
              id: 'zojF7jCp|@A]wY4#=h{l',
              fields: { VAR: { id: ')i{aJk-2z1DZLSKc}Qow' } },
              inputs: {
                VALUE: {
                  block: {
                    type: 'member_id',
                    id: '5hZN]5J$#T9WF$X1|^D|',
                    inputs: {
                      member: {
                        block: {
                          type: 'logic_nullishOperator',
                          id: 'IQI=JXOj_E3*@YLIa_Vw',
                          fields: { type: '??' },
                          inputs: {
                            value: {
                              block: {
                                type: 'slash_getoption',
                                id: '#}|nen^,GsvRMt$ulC7K',
                                fields: { type: 'User' },
                                inputs: {
                                  name: {
                                    block: {
                                      type: 'text',
                                      id: 'enI==r5k]iHDCW9A%OZ4',
                                      fields: { TEXT: 'user' },
                                    },
                                  },
                                },
                              },
                            },
                            fallback: {
                              block: {
                                type: 'slash_user',
                                id: 'jqiSg5tJ*$DPbtCnhXhc',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              next: {
                block: {
                  type: 'comment_stack',
                  id: '9ToBSOuK9fu;^s9lg7Yf',
                  fields: {
                    TEXT: "If user's balance is not found in the database",
                  },
                  next: {
                    block: {
                      type: 'controls_if',
                      id: ';eZe5xk-jYHVkeTM$vHA',
                      inputs: {
                        IF0: {
                          block: {
                            type: 'logic_negate',
                            id: 'qTta~X)z1ls:#%utP$#b',
                            inputs: {
                              BOOL: {
                                block: {
                                  type: 'db_has',
                                  id: 'P6CuMxnPaj?VWWQ?)wml',
                                  fields: { db: 'cash' },
                                  inputs: {
                                    id: {
                                      block: {
                                        type: 'variables_get',
                                        id: 'QjGtXgDHg%bixHTZ8rII',
                                        fields: {
                                          VAR: { id: ')i{aJk-2z1DZLSKc}Qow' },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        DO0: {
                          block: {
                            type: 'comment_stack',
                            id: 'C0dC)Gr}c^VJ5p38#ceE',
                            fields: { TEXT: "Set user's balance to 0" },
                            next: {
                              block: {
                                type: 'db_set',
                                id: '-tL#[n$YY9n7#il~3J56',
                                fields: { db: 'cash' },
                                inputs: {
                                  id: {
                                    block: {
                                      type: 'variables_get',
                                      id: 'z.+7HKQ6H.znP/H87g?o',
                                      fields: {
                                        VAR: { id: ')i{aJk-2z1DZLSKc}Qow' },
                                      },
                                    },
                                  },
                                  val: {
                                    block: {
                                      type: 'math_number',
                                      id: 'fG7`E15/2$;E:(Bo!pL~',
                                      fields: { NUM: 0 },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      next: {
                        block: {
                          type: 'comment_stack',
                          id: 'X9$@P64}2hHhR1p{{%qX',
                          fields: { TEXT: 'Balance command' },
                          next: {
                            block: {
                              type: 'controls_if',
                              id: '~(:_jPjAW|$Kdu=5I0If',
                              inputs: {
                                IF0: {
                                  block: {
                                    type: 'logic_compare',
                                    id: 'eMZQ3dd!/NajV359/zHH',
                                    fields: { OP: 'EQ' },
                                    inputs: {
                                      A: {
                                        block: {
                                          type: 'slash_name',
                                          id: 'jL(lf6N@`N(=pXRC4/.S',
                                        },
                                      },
                                      B: {
                                        block: {
                                          type: 'text',
                                          id: 'cAUmQLF%Sm3!1m_HP*!L',
                                          fields: { TEXT: 'balance' },
                                        },
                                      },
                                    },
                                  },
                                },
                                DO0: {
                                  block: {
                                    type: 'embed_create',
                                    id: '{kht3?,!Nk4l~bUhoAJ{',
                                    fields: { name: 'balance' },
                                    inputs: {
                                      config: {
                                        block: {
                                          type: 'embed_settitle',
                                          id: 'pMyHPk,*/8ifpouXYWe^',
                                          inputs: {
                                            value: {
                                              block: {
                                                type: 'text_join',
                                                id: 'tnGX$e]{16gyabnm^Ok(',
                                                extraState: { itemCount: 3 },
                                                inputs: {
                                                  ADD0: {
                                                    block: {
                                                      type: 'text',
                                                      id: 'la/~XBs$#HNV$gk9k^=n',
                                                      fields: { TEXT: '<@' },
                                                    },
                                                  },
                                                  ADD1: {
                                                    block: {
                                                      type: 'variables_get',
                                                      id: 'Us(!sGF%.901EV.5k}w%',
                                                      fields: {
                                                        VAR: {
                                                          id: ')i{aJk-2z1DZLSKc}Qow',
                                                        },
                                                      },
                                                    },
                                                  },
                                                  ADD2: {
                                                    block: {
                                                      type: 'text',
                                                      id: 'EoWF9;:zllFOj0.!/WOS',
                                                      fields: {
                                                        TEXT: ">'s balance",
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          next: {
                                            block: {
                                              type: 'embed_setdsc',
                                              id: '?7Bf$s|Az%l=t5u|8lsj',
                                              inputs: {
                                                value: {
                                                  block: {
                                                    type: 'text_join',
                                                    id: '|$x.Oy8BzGa$76=M1%o}',
                                                    extraState: {
                                                      itemCount: 2,
                                                    },
                                                    inputs: {
                                                      ADD0: {
                                                        block: {
                                                          type: 'text',
                                                          id: 'jZw5[(fCCQ;y3Qpv~O{(',
                                                          fields: {
                                                            TEXT: 'Cash: ',
                                                          },
                                                        },
                                                      },
                                                      ADD1: {
                                                        block: {
                                                          type: 'db_get',
                                                          id: 'dLa+Hu9rmES`_KyJ;%]/',
                                                          fields: {
                                                            db: 'cash',
                                                          },
                                                          inputs: {
                                                            id: {
                                                              block: {
                                                                type: 'variables_get',
                                                                id: '%lCYp1-cIS[qOaS((|?/',
                                                                fields: {
                                                                  VAR: {
                                                                    id: ')i{aJk-2z1DZLSKc}Qow',
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              next: {
                                                block: {
                                                  type: 'embed_setcolor',
                                                  id: 'bzl76wiNXr(`:KvC(22Q',
                                                  inputs: {
                                                    value: {
                                                      block: {
                                                        type: 'colour_picker',
                                                        id: 'Td(H+w8{]+KjXOZ665ia',
                                                        fields: {
                                                          COLOUR: '#3366ff',
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    next: {
                                      block: {
                                        type: 'slash_reply',
                                        id: ';1Y]Z}awEr:7mPLAvY8f',
                                        inputs: {
                                          content: {
                                            block: {
                                              type: 'text',
                                              id: 'Xscf0qeQ^l5/p1aNy}5j',
                                              fields: { TEXT: '' },
                                            },
                                          },
                                          embeds: {
                                            block: {
                                              type: 'text',
                                              id: ')ieiw?Qq5x0nE|dHvQr;',
                                              fields: { TEXT: 'balance' },
                                            },
                                          },
                                          ephemeral: {
                                            block: {
                                              type: 'logic_boolean',
                                              id: 'l;;W$q2}=.!5/Ti`{5{=',
                                              fields: { BOOL: 'FALSE' },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                              next: {
                                block: {
                                  type: 'comment_stack',
                                  id: '1}u9E0hZbN6]3[WM)Z{C',
                                  fields: { TEXT: 'Beg command' },
                                  next: {
                                    block: {
                                      type: 'controls_if',
                                      id: '0)!kmM,W:(TnV?gNmz$}',
                                      inputs: {
                                        IF0: {
                                          block: {
                                            type: 'logic_compare',
                                            id: 'E,rS9|xSrSh/)yh2]:gX',
                                            fields: { OP: 'EQ' },
                                            inputs: {
                                              A: {
                                                block: {
                                                  type: 'slash_name',
                                                  id: 'pewDYjD2!n-Z}qxb(lRP',
                                                },
                                              },
                                              B: {
                                                block: {
                                                  type: 'text',
                                                  id: 'hKd~X)=/H02adL?d(~P,',
                                                  fields: { TEXT: 'beg' },
                                                },
                                              },
                                            },
                                          },
                                        },
                                        DO0: {
                                          block: {
                                            type: 'controls_if',
                                            id: ':z,bO?I[=b9FLFWAYsM%',
                                            extraState: { hasElse: true },
                                            inputs: {
                                              IF0: {
                                                block: {
                                                  type: 'logic_compare',
                                                  id: 'BvS^~XM`n9^o.*D~v!L)',
                                                  fields: { OP: 'EQ' },
                                                  inputs: {
                                                    A: {
                                                      block: {
                                                        type: 'lists_getIndex',
                                                        id: '#OK/1wkQhhnV8qd[P6Bj',
                                                        fields: {
                                                          MODE: 'GET',
                                                          WHERE: 'RANDOM',
                                                        },
                                                        inputs: {
                                                          VALUE: {
                                                            block: {
                                                              type: 'lists_create_with',
                                                              id: 'w)[pFUpq}K)njRvuW1L#',
                                                              inline: true,
                                                              extraState: {
                                                                itemCount: 2,
                                                              },
                                                              inputs: {
                                                                ADD0: {
                                                                  block: {
                                                                    type: 'text',
                                                                    id: '/to|Scrm(EJDZ}5uP)6z',
                                                                    fields: {
                                                                      TEXT: 'yes',
                                                                    },
                                                                  },
                                                                },
                                                                ADD1: {
                                                                  block: {
                                                                    type: 'text',
                                                                    id: 'QJE15x.1j1N#wd-#`aaO',
                                                                    fields: {
                                                                      TEXT: 'no',
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                    B: {
                                                      block: {
                                                        type: 'text',
                                                        id: '5eIr,U8K_OcTL%e7+j$u',
                                                        fields: { TEXT: 'yes' },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              DO0: {
                                                block: {
                                                  type: 'variables_set',
                                                  id: 'a3=4jjEHwS@FE=$pT+Lk',
                                                  fields: {
                                                    VAR: {
                                                      id: 'sc(,I^83uYRD76m$Jmdp',
                                                    },
                                                  },
                                                  inputs: {
                                                    VALUE: {
                                                      block: {
                                                        type: 'math_random_int',
                                                        id: 'AUZSe*=HOFRC(`=_I5}^',
                                                        inputs: {
                                                          FROM: {
                                                            shadow: {
                                                              type: 'math_number',
                                                              id: 'lbmV?cnv}t)]OV?TVLiJ',
                                                              fields: {
                                                                NUM: 10,
                                                              },
                                                            },
                                                          },
                                                          TO: {
                                                            shadow: {
                                                              type: 'math_number',
                                                              id: 'CFOGpt~?c;8hL^gW.5T4',
                                                              fields: {
                                                                NUM: 150,
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                  next: {
                                                    block: {
                                                      type: 'embed_create',
                                                      id: 'ciZ?T94/oK[IF!LM8N_9',
                                                      fields: { name: 'beg' },
                                                      inputs: {
                                                        config: {
                                                          block: {
                                                            type: 'embed_settitle',
                                                            id: 'Fj?kaGB!+Hx*ROB[U.$R',
                                                            inputs: {
                                                              value: {
                                                                block: {
                                                                  type: 'text',
                                                                  id: ']+{@}A}/r3zveuyl8X*g',
                                                                  fields: {
                                                                    TEXT: 'Homeless Simulator',
                                                                  },
                                                                },
                                                              },
                                                            },
                                                            next: {
                                                              block: {
                                                                type: 'embed_setdsc',
                                                                id: 'k[(,gt#0yeS0X!mF}G%e',
                                                                inputs: {
                                                                  value: {
                                                                    block: {
                                                                      type: 'text_join',
                                                                      id: '3Qd91SC#.ROA.E_sK9yL',
                                                                      extraState:
                                                                        {
                                                                          itemCount: 3,
                                                                        },
                                                                      inputs: {
                                                                        ADD0: {
                                                                          block:
                                                                            {
                                                                              type: 'text',
                                                                              id: 'aW8`3|+vS#A$WzFN;w=!',
                                                                              fields:
                                                                                {
                                                                                  TEXT: 'You made $',
                                                                                },
                                                                            },
                                                                        },
                                                                        ADD1: {
                                                                          block:
                                                                            {
                                                                              type: 'variables_get',
                                                                              id: '}L6mWc:^r^/ch@fy7^5D',
                                                                              fields:
                                                                                {
                                                                                  VAR: {
                                                                                    id: 'sc(,I^83uYRD76m$Jmdp',
                                                                                  },
                                                                                },
                                                                            },
                                                                        },
                                                                        ADD2: {
                                                                          block:
                                                                            {
                                                                              type: 'text',
                                                                              id: '~yw4/SDGATls?i{lG3SU',
                                                                              fields:
                                                                                {
                                                                                  TEXT: ' while begging, maybe get a job instead.',
                                                                                },
                                                                            },
                                                                        },
                                                                      },
                                                                    },
                                                                  },
                                                                },
                                                                next: {
                                                                  block: {
                                                                    type: 'embed_setcolor',
                                                                    id: 'WVmWUbp^IBLxJCp.3X28',
                                                                    inputs: {
                                                                      value: {
                                                                        block: {
                                                                          type: 'colour_picker',
                                                                          id: 'moUl%5^s3=3nIlML!^#e',
                                                                          fields:
                                                                            {
                                                                              COLOUR:
                                                                                '#3366ff',
                                                                            },
                                                                        },
                                                                      },
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                      next: {
                                                        block: {
                                                          type: 'db_add',
                                                          id: 's``i)DqM1Gk6kI2!Sbzd',
                                                          fields: {
                                                            db: 'coins',
                                                          },
                                                          inputs: {
                                                            val: {
                                                              block: {
                                                                type: 'variables_get',
                                                                id: 'Q*Da+Q!@c]Lginx2e/!7',
                                                                fields: {
                                                                  VAR: {
                                                                    id: 'sc(,I^83uYRD76m$Jmdp',
                                                                  },
                                                                },
                                                              },
                                                            },
                                                            id: {
                                                              block: {
                                                                type: 'variables_get',
                                                                id: '[tNHtSYlB}@O0TH{H*x$',
                                                                fields: {
                                                                  VAR: {
                                                                    id: ')i{aJk-2z1DZLSKc}Qow',
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                          next: {
                                                            block: {
                                                              type: 'slash_reply',
                                                              id: 't}{qZ_B@w]x*q-EZ{S?!',
                                                              inputs: {
                                                                content: {
                                                                  block: {
                                                                    type: 'text',
                                                                    id: 'N@ySrlqK4!07(8u]K;U$',
                                                                    fields: {
                                                                      TEXT: '',
                                                                    },
                                                                  },
                                                                },
                                                                embeds: {
                                                                  block: {
                                                                    type: 'text',
                                                                    id: '3{%OY!7u?zu*7)i{-xJ!',
                                                                    fields: {
                                                                      TEXT: 'beg',
                                                                    },
                                                                  },
                                                                },
                                                                ephemeral: {
                                                                  block: {
                                                                    type: 'logic_boolean',
                                                                    id: 'C$CNho?6[crL-8h(CoBB',
                                                                    fields: {
                                                                      BOOL: 'FALSE',
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              ELSE: {
                                                block: {
                                                  type: 'slash_reply',
                                                  id: 'IiMP$q0w3w6!ao0byOZb',
                                                  inputs: {
                                                    content: {
                                                      block: {
                                                        type: 'text',
                                                        id: 'fvpk1,bE@!JAwx**$(BO',
                                                        fields: {
                                                          TEXT: 'You earned no money while begging and were beaten for being poor. ',
                                                        },
                                                      },
                                                    },
                                                    embeds: {
                                                      block: {
                                                        type: 'text',
                                                        id: 's7%uy7Yj5MG/1~Q`@CMT',
                                                        fields: { TEXT: '' },
                                                      },
                                                    },
                                                    ephemeral: {
                                                      block: {
                                                        type: 'logic_boolean',
                                                        id: '?Bcvt.*rOd?QHg?%8i1V',
                                                        fields: {
                                                          BOOL: 'FALSE',
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: 'db_create',
        id: '#C[/CA56@lSRo=E_~)oY',
        x: 0,
        y: 0,
        fields: { name: 'cash', path: 'cash' },
      },
    ],
  },
  variables: [
    { name: 'beg money', id: 'sc(,I^83uYRD76m$Jmdp' },
    { name: 'user', id: ')i{aJk-2z1DZLSKc}Qow' },
  ],
  backpack: [],
};
