# %%
#write a play
import openai
import random
# import docx
# from docx.shared import Pt
import pandas as pd
import numpy as np
import os


# %%
genre = "Adventure"

# %%
# Acts 16:16–34; Acts 17:16–34; Acts 18:1–11; Acts 26:1–29
# acts_list = ['Acts 16:16-34', 'Acts 17:16–34','Acts 18:1-11','Act 20:7-12', 'Acts 26:1-29','Acts 27',"Acts 28:1-11"]
# acts_list = ['Acts 16:16-34','Act 20:7-12']
# acts_list = ['Acts 17:16–34','Acts 18:1-11', 'Acts 26:1-29','Acts 27',"Acts 28:1-11"]
# verses = ['Matthew 1:18–25', 'Luke 1:26–38; 2:1–20']
verses = ['''
Ether 2 CHAPTER 2
The Jaredites prepare for their journey to a promised land—It is a choice land whereon men must serve Christ or be swept off—The Lord talks to the brother of Jared for three hours—The Jaredites build barges—The Lord asks the brother of Jared to propose how the barges will be lighted.
1 And it came to pass that Jared and his brother, and their families, and also the friends of Jared and his brother and their families, went down into the valley which was northward, (and the name of the valley was Nimrod, being called after the mighty hunter) with their flocks which they had gathered together, male and female, of every kind.
2 And they did also lay snares and catch fowls of the air; and they did also prepare a vessel, in which they did carry with them the fish of the waters.
3 And they did also carry with them deseret, which, by interpretation, is a honey bee; and thus they did carry with them swarms of bees, and all manner of that which was upon the face of the land, seeds of every kind.
4 And it came to pass that when they had come down into the valley of Nimrod the Lord came down and talked with the brother of Jared; and he was in a cloud, and the brother of Jared saw him not.
5 And it came to pass that the Lord commanded them that they should go forth into the wilderness, yea, into that quarter where there never had man been. And it came to pass that the Lord did go before them, and did talk with them as he stood in a cloud, and gave directions whither they should travel.
6 And it came to pass that they did travel in the wilderness, and did build barges, in which they did cross many waters, being directed continually by the hand of the Lord.
7 And the Lord would not suffer that they should stop beyond the sea in the wilderness, but he would that they should come forth even unto the land of promise, which was choice above all other lands, which the Lord God had preserved for a righteous people.
8 And he had sworn in his wrath unto the brother of Jared, that whoso should possess this land of promise, from that time henceforth and forever, should serve him, the true and only God, or they should be swept off when the fulness of his wrath should come upon them.
9 And now, we can behold the decrees of God concerning this land, that it is a land of promise; and whatsoever nation shall possess it shall serve God, or they shall be swept off when the fulness of his wrath shall come upon them. And the fulness of his wrath cometh upon them when they are ripened in iniquity.
10 For behold, this is a land which is choice above all other lands; wherefore he that doth possess it shall serve God or shall be swept off; for it is the everlasting decree of God. And it is not until the fulness of iniquity among the children of the land, that they are swept off.
11 And this cometh unto you, O ye Gentiles, that ye may know the decrees of God—that ye may repent, and not continue in your iniquities until the fulness come, that ye may not bring down the fulness of the wrath of God upon you as the inhabitants of the land have hitherto done.
12 Behold, this is a choice land, and whatsoever nation shall possess it shall be free from bondage, and from captivity, and from all other nations under heaven, if they will but serve the God of the land, who is Jesus Christ, who hath been manifested by the things which we have written.
13 And now I proceed with my record; for behold, it came to pass that the Lord did bring Jared and his brethren forth even to that great sea which divideth the lands. And as they came to the sea they pitched their tents; and they called the name of the place Moriancumer; and they dwelt in tents, and dwelt in tents upon the seashore for the space of four years.
14 And it came to pass at the end of four years that the Lord came again unto the brother of Jared, and stood in a cloud and talked with him. And for the space of three hours did the Lord talk with the brother of Jared, and chastened him because he remembered not to call upon the name of the Lord.
15 And the brother of Jared repented of the evil which he had done, and did call upon the name of the Lord for his brethren who were with him. And the Lord said unto him: I will forgive thee and thy brethren of their sins; but thou shalt not sin any more, for ye shall remember that my Spirit will not always strive with man; wherefore, if ye will sin until ye are fully ripe ye shall be cut off from the presence of the Lord. And these are my thoughts upon the land which I shall give you for your inheritance; for it shall be a land choice above all other lands.
16 And the Lord said: Go to work and build, after the manner of barges which ye have hitherto built. And it came to pass that the brother of Jared did go to work, and also his brethren, and built barges after the manner which they had built, according to the instructions of the Lord. And they were small, and they were light upon the water, even like unto the lightness of a fowl upon the water.
17 And they were built after a manner that they were exceedingly tight, even that they would hold water like unto a dish; and the bottom thereof was tight like unto a dish; and the sides thereof were tight like unto a dish; and the ends thereof were peaked; and the top thereof was tight like unto a dish; and the length thereof was the length of a tree; and the door thereof, when it was shut, was tight like unto a dish.
18 And it came to pass that the brother of Jared cried unto the Lord, saying: O Lord, I have performed the work which thou hast commanded me, and I have made the barges according as thou hast directed me.
19 And behold, O Lord, in them there is no light; whither shall we steer? And also we shall perish, for in them we cannot breathe, save it is the air which is in them; therefore we shall perish.
20 And the Lord said unto the brother of Jared: Behold, thou shalt make a hole in the top, and also in the bottom; and when thou shalt suffer for air thou shalt unstop the hole and receive air. And if it be so that the water come in upon thee, behold, ye shall stop the hole, that ye may not perish in the flood.
21 And it came to pass that the brother of Jared did so, according as the Lord had commanded.
22 And he cried again unto the Lord saying: O Lord, behold I have done even as thou hast commanded me; and I have prepared the vessels for my people, and behold there is no light in them. Behold, O Lord, wilt thou suffer that we shall cross this great water in darkness?
23 And the Lord said unto the brother of Jared: What will ye that I should do that ye may have light in your vessels? For behold, ye cannot have windows, for they will be dashed in pieces; neither shall ye take fire with you, for ye shall not go by the light of fire.
24 For behold, ye shall be as a whale in the midst of the sea; for the mountain waves shall dash upon you. Nevertheless, I will bring you up again out of the depths of the sea; for the winds have gone forth out of my mouth, and also the rains and the floods have I sent forth.
25 And behold, I prepare you against these things; for ye cannot cross this great deep save I prepare you against the waves of the sea, and the winds which have gone forth, and the floods which shall come. Therefore what will ye that I should prepare for you that ye may have light when ye are swallowed up in the depths of the sea?
    CHAPTER 3
The brother of Jared sees the finger of the Lord as He touches sixteen stones—Christ shows His spirit body to the brother of Jared—Those who have a perfect knowledge cannot be kept from within the veil—Interpreters are provided to bring the Jaredite record to light.
1 And it came to pass that the brother of Jared, (now the number of the vessels which had been prepared was eight) went forth unto the mount, which they called the mount Shelem, because of its exceeding height, and did molten out of a rock sixteen small stones; and they were white and clear, even as transparent glass; and he did carry them in his hands upon the top of the mount, and cried again unto the Lord, saying:
2 O Lord, thou hast said that we must be encompassed about by the floods. Now behold, O Lord, and do not be angry with thy servant because of his weakness before thee; for we know that thou art holy and dwellest in the heavens, and that we are unworthy before thee; because of the fall our natures have become evil continually; nevertheless, O Lord, thou hast given us a commandment that we must call upon thee, that from thee we may receive according to our desires.
3 Behold, O Lord, thou hast smitten us because of our iniquity, and hast driven us forth, and for these many years we have been in the wilderness; nevertheless, thou hast been merciful unto us. O Lord, look upon me in pity, and turn away thine anger from this thy people, and suffer not that they shall go forth across this raging deep in darkness; but behold these things which I have molten out of the rock.
4 And I know, O Lord, that thou hast all power, and can do whatsoever thou wilt for the benefit of man; therefore touch these stones, O Lord, with thy finger, and prepare them that they may shine forth in darkness; and they shall shine forth unto us in the vessels which we have prepared, that we may have light while we shall cross the sea.
5 Behold, O Lord, thou canst do this. We know that thou art able to show forth great power, which looks small unto the understanding of men.
6 And it came to pass that when the brother of Jared had said these words, behold, the Lord stretched forth his hand and touched the stones one by one with his finger. And the veil was taken from off the eyes of the brother of Jared, and he saw the finger of the Lord; and it was as the finger of a man, like unto flesh and blood; and the brother of Jared fell down before the Lord, for he was struck with fear.
7 And the Lord saw that the brother of Jared had fallen to the earth; and the Lord said unto him: Arise, why hast thou fallen?
8 And he saith unto the Lord: I saw the finger of the Lord, and I feared lest he should smite me; for I knew not that the Lord had flesh and blood.
9 And the Lord said unto him: Because of thy faith thou hast seen that I shall take upon me flesh and blood; and never has man come before me with such exceeding faith as thou hast; for were it not so ye could not have seen my finger. Sawest thou more than this?
 
          CHAPTER 6
The Jaredite barges are driven by the winds to the promised land—The people praise the Lord for His goodness—Orihah is appointed king over them—Jared and his brother die.
1 And now I, Moroni, proceed to give the record of Jared and his brother.
2 For it came to pass after the Lord had prepared the stones which the brother of Jared had carried up into the mount, the brother of Jared came down out of the mount, and he did put forth the stones into the vessels which were prepared, one in each end thereof; and behold, they did give light unto the vessels.
3 And thus the Lord caused stones to shine in darkness, to give light unto men, women, and children, that they might not cross the great waters in darkness.
4 And it came to pass that when they had prepared all manner of food, that thereby they might subsist upon the water, and also food for their flocks and herds, and whatsoever beast or animal or fowl that they should carry with them—and it came to pass that when they had done all these things they got aboard of their vessels or barges, and set forth into the sea, commending themselves unto the Lord their God.
5 And it came to pass that the Lord God caused that there should be a furious wind blow upon the face of the waters, towards the promised land; and thus they were tossed upon the waves of the sea before the wind.
6 And it came to pass that they were many times buried in the depths of the sea, because of the mountain waves which broke upon them, and also the great and terrible tempests which were caused by the fierceness of the wind.
7 And it came to pass that when they were buried in the deep there was no water that could hurt them, their vessels being tight like unto a dish, and also they were tight like unto the ark of Noah; therefore when they were encompassed about by many waters they did cry unto the Lord, and he did bring them forth again upon the top of the waters.
8 And it came to pass that the wind did never cease to blow towards the promised land while they were upon the waters; and thus they were driven forth before the wind.
9 And they did sing praises unto the Lord; yea, the brother of Jared did sing praises unto the Lord, and he did thank and praise the Lord all the day long; and when the night came, they did not cease to praise the Lord.
10 And thus they were driven forth; and no monster of the sea could break them, neither whale that could mar them; and they did have light continually, whether it was above the water or under the water.
11 And thus they were driven forth, three hundred and forty and four days upon the water.
12 And they did land upon the shore of the promised land. And when they had set their feet upon the shores of the promised land they bowed themselves down upon the face of the land, and did humble themselves before the Lord, and did shed tears of joy before the Lord, because of the multitude of his tender mercies over them.
13 And it came to pass that they went forth upon the face of the land, and began to till the earth.
14 And Jared had four sons; and they were called Jacom, and Gilgah, and Mahah, and Orihah.
15 And the brother of Jared also begat sons and daughters.
16 And the friends of Jared and his brother were in number about twenty and two souls; and they also begat sons and daughters before they came to the promised land; and therefore they began to be many.
17 And they were taught to walk humbly before the Lord; and they were also taught from on high.
            ''']


# %%
# Possible actor names for the play should be considered for the play
names = ['Kate',
         'Tyler',
         'Ryder',
        #  'Maren',
         'Ruby',
        #  'Emma',
         'Olivia',
        #  'Bella',
        #  'Spencer',
         'Emelia',
         'Naomi',
        #  'Jessica',
         'Joanna',
         'Trent',
        #  'Cooper',
        #  'Jonas',
        #  'Sophie',
         'Zack',
         'Abby',
         'Emy',
         'Charlie',
         'Olivia'
]

# %%
# verses = ['''Ether 2, CHAPTER 2
# The Jaredites prepare for their journey to a promised land—It is a choice land whereon men must serve Christ or be swept off—The Lord talks to the brother of Jared for three hours—The Jaredites build barges—The Lord asks the brother of Jared to propose how the barges will be lighted.
# 1 And it came to pass that Jared and his brother, and their families, and also the friends of Jared and his brother and their families, went down into the valley which was northward, (and the name of the valley was Nimrod, being called after the mighty hunter) with their flocks which they had gathered together, male and female, of every kind.
# 2 And they did also lay snares and catch fowls of the air; and they did also prepare a vessel, in which they did carry with them the fish of the waters.
# 3 And they did also carry with them deseret, which, by interpretation, is a honey bee; and thus they did carry with them swarms of bees, and all manner of that which was upon the face of the land, seeds of every kind.
# 4 And it came to pass that when they had come down into the valley of Nimrod the Lord came down and talked with the brother of Jared; and he was in a cloud, and the brother of Jared saw him not.
# 5 And it came to pass that the Lord commanded them that they should go forth into the wilderness, yea, into that quarter where there never had man been. And it came to pass that the Lord did go before them, and did talk with them as he stood in a cloud, and gave directions whither they should travel.
# 6 And it came to pass that they did travel in the wilderness, and did build barges, in which they did cross many waters, being directed continually by the hand of the Lord.
# 7 And the Lord would not suffer that they should stop beyond the sea in the wilderness, but he would that they should come forth even unto the land of promise, which was choice above all other lands, which the Lord God had preserved for a righteous people.
# 8 And he had sworn in his wrath unto the brother of Jared, that whoso should possess this land of promise, from that time henceforth and forever, should serve him, the true and only God, or they should be swept off when the fulness of his wrath should come upon them.
# 9 And now, we can behold the decrees of God concerning this land, that it is a land of promise; and whatsoever nation shall possess it shall serve God, or they shall be swept off when the fulness of his wrath shall come upon them. And the fulness of his wrath cometh upon them when they are ripened in iniquity.
# 10 For behold, this is a land which is choice above all other lands; wherefore he that doth possess it shall serve God or shall be swept off; for it is the everlasting decree of God. And it is not until the fulness of iniquity among the children of the land, that they are swept off.
# 11 And this cometh unto you, O ye Gentiles, that ye may know the decrees of God—that ye may repent, and not continue in your iniquities until the fulness come, that ye may not bring down the fulness of the wrath of God upon you as the inhabitants of the land have hitherto done.
# 12 Behold, this is a choice land, and whatsoever nation shall possess it shall be free from bondage, and from captivity, and from all other nations under heaven, if they will but serve the God of the land, who is Jesus Christ, who hath been manifested by the things which we have written.
# 13 And now I proceed with my record; for behold, it came to pass that the Lord did bring Jared and his brethren forth even to that great sea which divideth the lands. And as they came to the sea they pitched their tents; and they called the name of the place Moriancumer; and they dwelt in tents, and dwelt in tents upon the seashore for the space of four years.
# 14 And it came to pass at the end of four years that the Lord came again unto the brother of Jared, and stood in a cloud and talked with him. And for the space of three hours did the Lord talk with the brother of Jared, and chastened him because he remembered not to call upon the name of the Lord.
# 15 And the brother of Jared repented of the evil which he had done, and did call upon the name of the Lord for his brethren who were with him. And the Lord said unto him: I will forgive thee and thy brethren of their sins; but thou shalt not sin any more, for ye shall remember that my Spirit will not always strive with man; wherefore, if ye will sin until ye are fully ripe ye shall be cut off from the presence of the Lord. And these are my thoughts upon the land which I shall give you for your inheritance; for it shall be a land choice above all other lands.
# 16 And the Lord said: Go to work and build, after the manner of barges which ye have hitherto built. And it came to pass that the brother of Jared did go to work, and also his brethren, and built barges after the manner which they had built, according to the instructions of the Lord. And they were small, and they were light upon the water, even like unto the lightness of a fowl upon the water.
# 17 And they were built after a manner that they were exceedingly tight, even that they would hold water like unto a dish; and the bottom thereof was tight like unto a dish; and the sides thereof were tight like unto a dish; and the ends thereof were peaked; and the top thereof was tight like unto a dish; and the length thereof was the length of a tree; and the door thereof, when it was shut, was tight like unto a dish.
# 18 And it came to pass that the brother of Jared cried unto the Lord, saying: O Lord, I have performed the work which thou hast commanded me, and I have made the barges according as thou hast directed me.
# 19 And behold, O Lord, in them there is no light; whither shall we steer? And also we shall perish, for in them we cannot breathe, save it is the air which is in them; therefore we shall perish.
# 20 And the Lord said unto the brother of Jared: Behold, thou shalt make a hole in the top, and also in the bottom; and when thou shalt suffer for air thou shalt unstop the hole and receive air. And if it be so that the water come in upon thee, behold, ye shall stop the hole, that ye may not perish in the flood.
# 21 And it came to pass that the brother of Jared did so, according as the Lord had commanded.
# 22 And he cried again unto the Lord saying: O Lord, behold I have done even as thou hast commanded me; and I have prepared the vessels for my people, and behold there is no light in them. Behold, O Lord, wilt thou suffer that we shall cross this great water in darkness?
# 23 And the Lord said unto the brother of Jared: What will ye that I should do that ye may have light in your vessels? For behold, ye cannot have windows, for they will be dashed in pieces; neither shall ye take fire with you, for ye shall not go by the light of fire.
# 24 For behold, ye shall be as a whale in the midst of the sea; for the mountain waves shall dash upon you. Nevertheless, I will bring you up again out of the depths of the sea; for the winds have gone forth out of my mouth, and also the rains and the floods have I sent forth.
# 25 And behold, I prepare you against these things; for ye cannot cross this great deep save I prepare you against the waves of the sea, and the winds which have gone forth, and the floods which shall come. Therefore what will ye that I should prepare for you that ye may have light when ye are swallowed up in the depths of the sea?
#     CHAPTER 3
# The brother of Jared sees the finger of the Lord as He touches sixteen stones—Christ shows His spirit body to the brother of Jared—Those who have a perfect knowledge cannot be kept from within the veil—Interpreters are provided to bring the Jaredite record to light.
# 1 And it came to pass that the brother of Jared, (now the number of the vessels which had been prepared was eight) went forth unto the mount, which they called the mount Shelem, because of its exceeding height, and did molten out of a rock sixteen small stones; and they were white and clear, even as transparent glass; and he did carry them in his hands upon the top of the mount, and cried again unto the Lord, saying:
# 2 O Lord, thou hast said that we must be encompassed about by the floods. Now behold, O Lord, and do not be angry with thy servant because of his weakness before thee; for we know that thou art holy and dwellest in the heavens, and that we are unworthy before thee; because of the fall our natures have become evil continually; nevertheless, O Lord, thou hast given us a commandment that we must call upon thee, that from thee we may receive according to our desires.
# 3 Behold, O Lord, thou hast smitten us because of our iniquity, and hast driven us forth, and for these many years we have been in the wilderness; nevertheless, thou hast been merciful unto us. O Lord, look upon me in pity, and turn away thine anger from this thy people, and suffer not that they shall go forth across this raging deep in darkness; but behold these things which I have molten out of the rock.
# 4 And I know, O Lord, that thou hast all power, and can do whatsoever thou wilt for the benefit of man; therefore touch these stones, O Lord, with thy finger, and prepare them that they may shine forth in darkness; and they shall shine forth unto us in the vessels which we have prepared, that we may have light while we shall cross the sea.
# 5 Behold, O Lord, thou canst do this. We know that thou art able to show forth great power, which looks small unto the understanding of men.
# 6 And it came to pass that when the brother of Jared had said these words, behold, the Lord stretched forth his hand and touched the stones one by one with his finger. And the veil was taken from off the eyes of the brother of Jared, and he saw the finger of the Lord; and it was as the finger of a man, like unto flesh and blood; and the brother of Jared fell down before the Lord, for he was struck with fear.
# 7 And the Lord saw that the brother of Jared had fallen to the earth; and the Lord said unto him: Arise, why hast thou fallen?
# 8 And he saith unto the Lord: I saw the finger of the Lord, and I feared lest he should smite me; for I knew not that the Lord had flesh and blood.
# 9 And the Lord said unto him: Because of thy faith thou hast seen that I shall take upon me flesh and blood; and never has man come before me with such exceeding faith as thou hast; for were it not so ye could not have seen my finger. Sawest thou more than this?
 
#           CHAPTER 6
# The Jaredite barges are driven by the winds to the promised land—The people praise the Lord for His goodness—Orihah is appointed king over them—Jared and his brother die.
# 1 And now I, Moroni, proceed to give the record of Jared and his brother.
# 2 For it came to pass after the Lord had prepared the stones which the brother of Jared had carried up into the mount, the brother of Jared came down out of the mount, and he did put forth the stones into the vessels which were prepared, one in each end thereof; and behold, they did give light unto the vessels.
# 3 And thus the Lord caused stones to shine in darkness, to give light unto men, women, and children, that they might not cross the great waters in darkness.
# 4 And it came to pass that when they had prepared all manner of food, that thereby they might subsist upon the water, and also food for their flocks and herds, and whatsoever beast or animal or fowl that they should carry with them—and it came to pass that when they had done all these things they got aboard of their vessels or barges, and set forth into the sea, commending themselves unto the Lord their God.
# 5 And it came to pass that the Lord God caused that there should be a furious wind blow upon the face of the waters, towards the promised land; and thus they were tossed upon the waves of the sea before the wind.
# 6 And it came to pass that they were many times buried in the depths of the sea, because of the mountain waves which broke upon them, and also the great and terrible tempests which were caused by the fierceness of the wind.
# 7 And it came to pass that when they were buried in the deep there was no water that could hurt them, their vessels being tight like unto a dish, and also they were tight like unto the ark of Noah; therefore when they were encompassed about by many waters they did cry unto the Lord, and he did bring them forth again upon the top of the waters.
# 8 And it came to pass that the wind did never cease to blow towards the promised land while they were upon the waters; and thus they were driven forth before the wind.
# 9 And they did sing praises unto the Lord; yea, the brother of Jared did sing praises unto the Lord, and he did thank and praise the Lord all the day long; and when the night came, they did not cease to praise the Lord.
# 10 And thus they were driven forth; and no monster of the sea could break them, neither whale that could mar them; and they did have light continually, whether it was above the water or under the water.
# 11 And thus they were driven forth, three hundred and forty and four days upon the water.
# 12 And they did land upon the shore of the promised land. And when they had set their feet upon the shores of the promised land they bowed themselves down upon the face of the land, and did humble themselves before the Lord, and did shed tears of joy before the Lord, because of the multitude of his tender mercies over them.
# 13 And it came to pass that they went forth upon the face of the land, and began to till the earth.
# 14 And Jared had four sons; and they were called Jacom, and Gilgah, and Mahah, and Orihah.
# 15 And the brother of Jared also begat sons and daughters.
# 16 And the friends of Jared and his brother were in number about twenty and two souls; and they also begat sons and daughters before they came to the promised land; and therefore they began to be many.
# 17 And they were taught to walk humbly before the Lord; and they were also taught from on high.
#             ''']

# %%
# Define the conversation with the prompt
def generate_message(content, role='system'):
    return {'role': role, 'content': content}

# %%
#name a function to ranomiize the order of the list of names
def randomize_names(names):
    random.shuffle(names)
    list_of_names = str(list(set([x for x in names])))
    return list_of_names

# %%
def make_prompt(verses_with_story, list_of_names, genre):
    prompt_conext_part_1 = "Write a 20 minute play about a story from the LDS scripture. The actors will be reading the play while seated. All action will need to be described by a narrator or in the characters dialgoue." 
    prompt_conext_part_2 = "\n\n Choose characters from the story and assign them to actors. The narrator will also be assigned from the list of actors. No name will be assigned to more than one part. The list of actors is: "+list_of_names
    prompt_conext_part_3 = "\n\nThe story is from "+verses_with_story+"."
    prompt_conext_part_4 = "\n\nThe genre of the play should be: "+genre
    # prompt_conext_part_4 = "\n\nThe play should focus on the way each character was blessed by serving others."
    prompt_conext_part_5 = "\n\nBegin the the play with a playbill showing which name will play each part. In the script place the name of each actory next to the character name."
    prompt_conext_part_6 = "\n\nThe play should not make references to coffee, tea, alcohol, or tobacco."
    prompt = prompt_conext_part_1+prompt_conext_part_2+prompt_conext_part_3+prompt_conext_part_4+prompt_conext_part_5+prompt_conext_part_6
    return prompt

# %%
# make a role
role = "you are a youth minister who worked as a professional improv comedian for 7 years. your job is to write funny, cheesy, retellings of scriptures from the church of Jesus Christ of Latter-day saints that engage teenagers and help teach them the gospel."
# role = "you are a children's youth minister teaching 9 year olds. Y worked as a professional improv comedian for 7 years. your job is to write funny, cheesy, retellings of scriptures from the church of Jesus Christ of Latter-day saints that engage 9 year olds and help teach them the gospel."

# %%
names_list = names
for i in verses:
    #print and index
    print(i)
    verses_with_story = i
    # If the names list is shorter than 5, then add all the name back to the list
    if len(names_list) < 5:
        names_list = names.copy()
    list_of_names = randomize_names(names_list) 
    prompt = make_prompt(verses_with_story, list_of_names, genre)
    client = OpenAI(api_key=OPENAI_API_KEY)
    # Updated API usage
    response = client.chat.completions.create(
        model="gpt-4o-2024-08-06",
        messages=[
            {
            "role": "system",
            "content": role
            },
            {
            "role": "user",
            "content": prompt
            }
        ],
        temperature=0.8,
        max_tokens=10000,
        top_p=1
        )

    # Process response to remove used names
    content = response.choices[0].message.content.strip()
    # comment this out when there are few kids
    # for name in names_list[:]:
    #     if name in content:
    #         names_list.remove(name)

    # Directory for saving plays
    directory = './plays'
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Replace invalid characters for file name and just take the first 15 characters
    verses_with_story_for_file_name = verses_with_story.replace(":", "_").replace("/", "_")[0:10]

    # File name
    filename = f'{directory}/{genre}_{verses_with_story_for_file_name}_10k_window2.txt'

    # Save content to a file
    with open(filename, 'w') as file:
        file.write(content)


# %%


# %%



