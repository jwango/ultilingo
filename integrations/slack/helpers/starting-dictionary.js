const CONTRACTIONS = [
  'aint',
  'arent',
  'cant',
  'couldve',
  'couldnt',
  'couldntve',
  'didnt',
  'doesnt',
  'dont',
  'hadnt',
  'hadntve',
  'hasnt',
  'havent',
  'hed',
  'hedve',
  'hell',
  'hes',
  'howd',
  'howll',
  'hows',
  'Id',
  'Idve',
  'Ill',
  'Im',
  'Ive',
  'isnt',
  'itd',
  'itdve',
  'itll',
  'its',
  'lets',
  'maam',
  'mightnt',
  'mightntve',
  'mightve',
  'mustnt',
  'mustve',
  'neednt',
  'notve',
  'oclock',
  'oughtnt',
  'owsat',
  'shant',
  'shed',
  'shedve',
  'shell',
  'shes',
  'shouldve',
  'shouldnt',
  'shouldntve',
  'somebodyd',
  'somebodydve',
  'somebodyll',
  'somebodys',
  'someoned',
  'someonedve',
  'someonell',
  'someones',
  'somethingd',
  'somethingdve',
  'somethingll',
  'somethings',
  'thatll',
  'thats',
  'thered',
  'theredve',
  'therere',
  'theres',
  'theyd',
  'theydve',
  'theyll',
  'theyre',
  'theyve',
  'twas',
  'wasnt',
  'wed',
  'wedve',
  'well',
  'were',
  'weve',
  'werent',
  'whatll',
  'whatre',
  'whats',
  'whatve',
  'whens',
  'whered',
  'wheres',
  'whereve',
  'whod',
  'whodve',
  'wholl',
  'whore',
  'whos',
  'whove',
  'whyll',
  'whyre',
  'whys',
  'wont',
  'wouldve',
  'wouldnt',
  'wouldntve',
  'yall',
  'yallll',
  'yalldve',
  'youd',
  'youdve',
  'youll',
  'youre',
  'youve'
];

const COMMON_TECH_TERMS = [
  'emoji'
];

const STARTING_DICTIONARY = CONTRACTIONS.concat(COMMON_TECH_TERMS);

module.exports = STARTING_DICTIONARY;