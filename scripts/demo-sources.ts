// Source texts for the demo pages. Novels are public domain (Project Gutenberg);
// news articles and "one sentence" contexts are written for this project.
import type { Profile } from "@mabarint/types";

export interface DemoSource {
  id: string;
  title: string;
  credit: string;
  profile: Profile;
  text: string;
  context?: string;
}

export const HOME: DemoSource = {
  id: "home",
  title: "A phone call",
  credit: "Written for Mabarint",
  profile: "novel",
  text: `Mara read the message twice before she could breathe. "No," she whispered. "He was fine this morning."

Her brother leaned against the door frame. "Oh, wonderful," he muttered. "Another family emergency. Just what I needed today."`,
};

export const NOVELS: DemoSource[] = [
  {
    id: "alice",
    title: "A Mad Tea-Party",
    credit: "Lewis Carroll, Alice's Adventures in Wonderland (1865), chapter VII. Public domain.",
    profile: "novel",
    text: `"Have some wine," the March Hare said in an encouraging tone.

Alice looked all round the table, but there was nothing on it but tea. "I don't see any wine," she remarked.

"There isn't any," said the March Hare.

"Then it wasn't very civil of you to offer it," said Alice angrily.

"It wasn't very civil of you to sit down without being invited," said the March Hare.`,
  },
  {
    id: "pride",
    title: "Netherfield Park is let at last",
    credit: "Jane Austen, Pride and Prejudice (1813), chapter 1. Public domain.",
    profile: "novel",
    text: `"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."`,
  },
];

export const NEWS: DemoSource[] = [
  {
    id: "news-library",
    title: "Riverside library reopens after flood repairs",
    credit: "Sample article written for Mabarint. Names and places are fictional.",
    profile: "news",
    text: `The Riverside Community Library reopened on Saturday, eight months after a burst water main flooded its ground floor. Volunteers rebuilt the children's corner and replaced more than four thousand books donated by residents.

"When we saw the queue outside this morning, we honestly cried," said head librarian Ana Torres. "These kids waited all winter. Today they finally got their library back."

Eleven-year-old Sam Okafor was the first to borrow a book. "I'm taking the dragon one," he said. "The biggest one they have!"

The library is open daily from 9 a.m. to 7 p.m.`,
  },
  {
    id: "news-bakery",
    title: "Corner bakery closes after 61 years",
    credit: "Sample article written for Mabarint. Names and places are fictional.",
    profile: "news",
    text: `Hartley's Bakery on Elm Street served its last loaves on Friday, closing after 61 years in the same family. Owner Ruth Hartley, 78, said rising rents and her own health made it impossible to continue.

"My father opened this shop with one oven and a borrowed table," Hartley said, pausing at the counter. "I kept thinking someone would take it over. Nobody did."

Regular customer Joe Mendes, who has bought bread there every morning since 1989, stood outside after closing time. "It's just a shop, people say. It isn't. It was the first place I went when my wife passed."

The building will be put up for sale next month.`,
  },
];

export const MEANINGS_SENTENCE = "I didn't say she stole it.";

/** Same sentence, different preceding contexts: each should move the stress. */
export const MEANINGS: Array<{ id: string; expect: string; context: string }> = [
  {
    id: "i",
    expect: "I",
    context: `Everyone at the table turned to look at Tom when the manager mentioned the missing laptop. Tom raised both hands. "Whoa, don't look at me. That accusation came from Priya. She said it, not me."`,
  },
  {
    id: "didnt",
    expect: "didn't",
    context: `"You told the whole office that Lena stole the laptop!" Priya shouted. Tom shook his head hard, his voice rising. "That's a lie, and you know it."`,
  },
  {
    id: "say",
    expect: "say",
    context: `"So you think Lena stole it?" Priya asked. Tom shrugged and lowered his voice. "I'm not stupid. I only raised an eyebrow when her name came up. Read into that what you like."`,
  },
  {
    id: "she",
    expect: "she",
    context: `"You accused Lena of stealing the laptop," Priya said. Tom leaned forward. "Listen carefully. I said someone on her team took it. Someone. Not Lena."`,
  },
  {
    id: "stole",
    expect: "stole",
    context: `"You said Lena stole the laptop," Priya insisted. Tom sighed. "She borrowed it on Friday without asking. That's rude, sure. But borrowing isn't a crime."`,
  },
  {
    id: "it",
    expect: "it",
    context: `"You said Lena stole the laptop," Priya said. Tom pointed at the laptop on his desk. "The laptop never left this room. What I said is that she stole the charger. The charger, not the laptop."`,
  },
];

export const SCRIPT: DemoSource = {
  id: "script",
  title: "Bedtime story opening",
  credit: "Written for Mabarint",
  profile: "script",
  text: `Once upon a time, in a village at the edge of a very dark forest, there lived a girl who was afraid of nothing. Nothing at all. Until the night the lanterns went out.`,
};
