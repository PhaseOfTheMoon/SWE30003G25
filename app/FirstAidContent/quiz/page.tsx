"use client";

import { useEffect, useState } from "react";

type Question = {
  question: string;
  options: string[];
  answer: string;
};

type Quiz = {
  quizID: string;
  question: Question[];
  totalMark: number;
  score: number;
};

type Step = "pet" | "category" | "quiz";

const PET_EMOJI: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Bird: "🐦",
  Rabbit: "🐇",
  Other: "🐾",
};

const CAT_EMOJI: Record<string, string> = {
  Choking: "😮",
  Bleeding: "🩸",
  Burns: "🔥",
  Fracture: "🦴",
  Poisoning: "☠️",
  Seizure: "⚡",
  Heatstroke: "🌡️",
  Unconscious: "💤",
};

const questionBank: Record<string, Record<string, Question[]>> = {
  Dog: {
    Choking: [
      {
        question: "What is the first thing you should do if your dog is choking?",
        options: ["Open the mouth and look for an obstruction", "Give the dog water", "Make the dog run", "Feed the dog more food"],
        answer: "Open the mouth and look for an obstruction",
      },
      {
        question: "How should you perform the Heimlich maneuver on a large dog?",
        options: ["Apply firm thrusts just below the rib cage", "Shake the dog vigorously", "Turn the dog upside down", "Squeeze its neck"],
        answer: "Apply firm thrusts just below the rib cage",
      },
      {
        question: "What sign indicates a dog is choking?",
        options: ["Pawing at the mouth and gagging", "Wagging its tail", "Sleeping quietly", "Eating normally"],
        answer: "Pawing at the mouth and gagging",
      },
      {
        question: "After removing an obstruction from a choking dog, you should:",
        options: ["Take the dog to a vet immediately", "Give it more food", "Let it sleep", "Ignore any further symptoms"],
        answer: "Take the dog to a vet immediately",
      },
      {
        question: "If you cannot see the obstruction in your dog's mouth, you should:",
        options: ["Rush to an emergency vet", "Try to make the dog vomit", "Give the dog milk", "Wait and watch"],
        answer: "Rush to an emergency vet",
      },
    ],
    Bleeding: [
      {
        question: "What is the most important first step when your dog is bleeding?",
        options: ["Apply direct pressure to the wound", "Give the dog painkillers", "Wash with hot water", "Apply ice directly"],
        answer: "Apply direct pressure to the wound",
      },
      {
        question: "How long should you hold pressure on a bleeding wound?",
        options: ["At least 3–5 minutes", "10 seconds", "Just until the bleeding slows", "1 minute"],
        answer: "At least 3–5 minutes",
      },
      {
        question: "Which item in a first aid kit helps control bleeding?",
        options: ["Sterile gauze or bandage", "Chocolate", "Perfume", "Glue"],
        answer: "Sterile gauze or bandage",
      },
      {
        question: "A tourniquet on a dog's limb should only be used:",
        options: ["For life-threatening limb bleeding as a last resort", "For any small cut", "Before applying pressure", "To prevent swelling"],
        answer: "For life-threatening limb bleeding as a last resort",
      },
      {
        question: "After controlling bleeding, the next step is to:",
        options: ["Transport the dog to a vet", "Feed the dog to restore energy", "Let it rest for a week at home", "Apply more pressure indefinitely"],
        answer: "Transport the dog to a vet",
      },
    ],
    Burns: [
      {
        question: "What should you do immediately if your dog gets a burn?",
        options: ["Cool the area with clean cool water for 10 minutes", "Apply butter or oil", "Cover with a hot towel", "Rub the burn"],
        answer: "Cool the area with clean cool water for 10 minutes",
      },
      {
        question: "What should you NOT apply to a dog's burn?",
        options: ["Ice directly on the skin", "Cool running water", "Sterile gauze", "Nothing — go straight to vet"],
        answer: "Ice directly on the skin",
      },
      {
        question: "Which type of burn requires immediate vet attention?",
        options: ["Any burn larger than a small area or involving the face", "A very tiny surface reddening", "Mild heat from sun exposure", "A warm paw pad"],
        answer: "Any burn larger than a small area or involving the face",
      },
      {
        question: "Chemical burns on a dog should be treated by:",
        options: ["Rinsing with large amounts of water and calling a vet", "Applying vinegar", "Covering with a bandage", "Waiting to see if it heals"],
        answer: "Rinsing with large amounts of water and calling a vet",
      },
      {
        question: "How can you tell a dog has a serious burn?",
        options: ["Blistering, raw skin, or visible tissue damage", "Normal behavior and eating", "The dog is slightly warm", "Mild whimpering for a moment"],
        answer: "Blistering, raw skin, or visible tissue damage",
      },
    ],
    Fracture: [
      {
        question: "If you suspect your dog has a broken bone, you should first:",
        options: ["Keep the dog as still and calm as possible", "Massage the injured leg", "Encourage it to walk it off", "Splint it yourself tightly"],
        answer: "Keep the dog as still and calm as possible",
      },
      {
        question: "What is a sign of a fracture in a dog?",
        options: ["Limping and unwillingness to bear weight", "Eating enthusiastically", "Playing normally", "Sleeping more than usual"],
        answer: "Limping and unwillingness to bear weight",
      },
      {
        question: "When moving a dog with a possible fracture, you should:",
        options: ["Support the entire body and minimize movement of the injury", "Lift only by the injured limb", "Let it hop on its own", "Carry it by the scruff"],
        answer: "Support the entire body and minimize movement of the injury",
      },
      {
        question: "Should you try to set a broken bone at home?",
        options: ["No — only a vet should treat fractures", "Yes, gently push it back into place", "Yes, if the dog is calm", "Only for small dogs"],
        answer: "No — only a vet should treat fractures",
      },
      {
        question: "An open fracture (bone visible through skin) is:",
        options: ["A veterinary emergency requiring immediate care", "Less serious than a closed fracture", "Safe to bandage tightly at home", "Normal in older dogs"],
        answer: "A veterinary emergency requiring immediate care",
      },
    ],
    Poisoning: [
      {
        question: "What food is toxic to dogs?",
        options: ["Chocolate", "Plain boiled chicken", "Carrot", "Plain rice"],
        answer: "Chocolate",
      },
      {
        question: "If you suspect your dog has been poisoned, you should immediately:",
        options: ["Call a vet or poison hotline", "Induce vomiting yourself", "Give the dog milk", "Wait for symptoms to appear"],
        answer: "Call a vet or poison hotline",
      },
      {
        question: "Which household item is dangerous to dogs?",
        options: ["Xylitol (sugar substitute)", "Plain water", "Boiled rice", "Dog biscuits"],
        answer: "Xylitol (sugar substitute)",
      },
      {
        question: "Signs of poisoning in a dog include:",
        options: ["Vomiting, tremors, and excessive drooling", "Normal playing and eating", "Sleeping calmly", "Drinking more water"],
        answer: "Vomiting, tremors, and excessive drooling",
      },
      {
        question: "When calling the vet about a suspected poisoning, it is helpful to:",
        options: ["Describe what the dog may have eaten and how much", "Only describe the symptoms", "Say nothing until the vet asks", "Wait to see if symptoms worsen first"],
        answer: "Describe what the dog may have eaten and how much",
      },
    ],
    Seizure: [
      {
        question: "What should you do when your dog has a seizure?",
        options: ["Keep it away from furniture and sharp objects", "Hold its mouth open", "Put food in its mouth", "Shake it to wake it up"],
        answer: "Keep it away from furniture and sharp objects",
      },
      {
        question: "How long should a dog seizure last before it becomes an emergency?",
        options: ["More than 5 minutes", "More than 30 seconds", "Any seizure is immediately an emergency", "More than 1 hour"],
        answer: "More than 5 minutes",
      },
      {
        question: "After a seizure, a dog may be:",
        options: ["Confused, disoriented, or temporarily blind", "Completely normal instantly", "Hungry and energetic", "Ready to play"],
        answer: "Confused, disoriented, or temporarily blind",
      },
      {
        question: "During a dog seizure, you should NOT:",
        options: ["Put your hand near its mouth", "Stay calm", "Time the duration", "Clear the area of hazards"],
        answer: "Put your hand near its mouth",
      },
      {
        question: "What information should you record during your dog's seizure?",
        options: ["Duration, movements, and time of onset", "The dog's last meal only", "Nothing — focus on comfort only", "The weather conditions"],
        answer: "Duration, movements, and time of onset",
      },
    ],
    Heatstroke: [
      {
        question: "What is the most obvious sign of heatstroke in a dog?",
        options: ["Excessive panting and drooling", "Sleeping quietly", "Eating slowly", "Wagging tail"],
        answer: "Excessive panting and drooling",
      },
      {
        question: "How should you cool down a dog with heatstroke?",
        options: ["Move it to shade and apply cool (not ice cold) water", "Wrap it in a warm blanket", "Give it ice cubes to swallow", "Leave it in a cool car"],
        answer: "Move it to shade and apply cool (not ice cold) water",
      },
      {
        question: "Why should you NOT use ice water to cool a heatstroke dog?",
        options: ["It can cause blood vessels to constrict and worsen the condition", "It is too messy", "Dogs don't like water", "It is too cold for their paws"],
        answer: "It can cause blood vessels to constrict and worsen the condition",
      },
      {
        question: "After first aid for heatstroke, you should:",
        options: ["Seek vet care even if the dog seems to have recovered", "Let the dog rest and monitor at home", "Give the dog food immediately", "Keep the dog in the sun to dry off"],
        answer: "Seek vet care even if the dog seems to have recovered",
      },
      {
        question: "Which dogs are at highest risk for heatstroke?",
        options: ["Flat-faced breeds like Bulldogs and Pugs", "Large active breeds", "Young puppies only", "Elderly cats"],
        answer: "Flat-faced breeds like Bulldogs and Pugs",
      },
    ],
    Unconscious: [
      {
        question: "If your dog is unconscious, the first thing to check is:",
        options: ["Breathing and a pulse", "Whether it is hungry", "The temperature outside", "Its last vaccination record"],
        answer: "Breathing and a pulse",
      },
      {
        question: "If an unconscious dog is not breathing, you should:",
        options: ["Begin rescue breathing and call a vet immediately", "Wait 10 minutes before acting", "Give it water", "Shake it firmly"],
        answer: "Begin rescue breathing and call a vet immediately",
      },
      {
        question: "To check if an unconscious dog has a pulse, feel for it at the:",
        options: ["Femoral artery on the inner thigh", "Top of the head", "Behind the ear", "Under the chin"],
        answer: "Femoral artery on the inner thigh",
      },
      {
        question: "When transporting an unconscious dog to the vet, you should:",
        options: ["Keep it on a flat surface and support its head and neck", "Hold it upright by the torso", "Let it lie however it falls", "Carry it by one leg"],
        answer: "Keep it on a flat surface and support its head and neck",
      },
      {
        question: "Possible causes of unconsciousness in a dog include:",
        options: ["Poisoning, trauma, or severe heatstroke", "Boredom or sleepiness", "Overeating", "Being too playful"],
        answer: "Poisoning, trauma, or severe heatstroke",
      },
    ],
  },
  Cat: {
    Choking: [
      {
        question: "What is a common sign that a cat is choking?",
        options: ["Pawing at the mouth and open-mouth breathing", "Purring loudly", "Eating normally", "Grooming itself"],
        answer: "Pawing at the mouth and open-mouth breathing",
      },
      {
        question: "When checking a choking cat's mouth, you should:",
        options: ["Be careful to avoid being bitten", "Reach deep inside immediately", "Ignore the cat's discomfort", "Give it water"],
        answer: "Be careful to avoid being bitten",
      },
      {
        question: "For a small cat with a choking obstruction, you can try:",
        options: ["Holding it with head down and giving a firm back blow between shoulder blades", "Shaking it vigorously", "Blowing air into its mouth", "Squeezing its stomach hard"],
        answer: "Holding it with head down and giving a firm back blow between shoulder blades",
      },
      {
        question: "After clearing a choking episode in a cat, the next step is:",
        options: ["Visit a vet to check for injury to the throat", "Feed it immediately", "Ignore further monitoring", "Bathe the cat"],
        answer: "Visit a vet to check for injury to the throat",
      },
      {
        question: "Cats are most commonly at risk of choking on:",
        options: ["Small bones, string, or toys", "Water", "Dry cat food", "Vegetables"],
        answer: "Small bones, string, or toys",
      },
    ],
    Bleeding: [
      {
        question: "To control bleeding in a cat, you should:",
        options: ["Apply gentle but firm pressure with a clean cloth", "Pour hydrogen peroxide on the wound", "Leave it to clot on its own without covering", "Rub the wound to remove debris"],
        answer: "Apply gentle but firm pressure with a clean cloth",
      },
      {
        question: "Internal bleeding in a cat may be indicated by:",
        options: ["Pale gums, weakness, and a distended abdomen", "Normal eating and playing", "Excessive purring", "Scratching furniture"],
        answer: "Pale gums, weakness, and a distended abdomen",
      },
      {
        question: "A wound that is bleeding heavily and not stopping after 5 minutes of pressure requires:",
        options: ["Immediate emergency vet care", "Another 30 minutes of waiting", "Ice only", "No action — cats heal quickly"],
        answer: "Immediate emergency vet care",
      },
      {
        question: "Which material is best for applying pressure to a cat's bleeding wound?",
        options: ["Clean sterile gauze", "Paper towel only", "Cotton wool directly in the wound", "Adhesive tape without padding"],
        answer: "Clean sterile gauze",
      },
      {
        question: "After treating a bleeding wound in a cat, you should prevent it from:",
        options: ["Licking the wound", "Sleeping", "Drinking water", "Sitting quietly"],
        answer: "Licking the wound",
      },
    ],
    Poisoning: [
      {
        question: "Which common plant is toxic to cats?",
        options: ["Lilies", "Rosemary", "Catnip", "Lavender in small amounts"],
        answer: "Lilies",
      },
      {
        question: "If a cat has ingested a toxic substance, you should:",
        options: ["Contact a vet or pet poison hotline immediately", "Try to make it vomit at home", "Give it milk to dilute the poison", "Observe it for a full day before acting"],
        answer: "Contact a vet or pet poison hotline immediately",
      },
      {
        question: "Signs of poisoning in a cat include:",
        options: ["Drooling, vomiting, lethargy, and seizures", "Increased appetite", "Normal grooming", "Sleeping more than usual"],
        answer: "Drooling, vomiting, lethargy, and seizures",
      },
      {
        question: "Essential oils are:",
        options: ["Toxic to cats even in small concentrations", "Safe as long as diluted", "Beneficial for calming cats", "Only harmful if ingested orally"],
        answer: "Toxic to cats even in small concentrations",
      },
      {
        question: "Human medications like paracetamol (acetaminophen) are:",
        options: ["Extremely toxic and potentially fatal to cats", "Safe in small doses", "Only risky for kittens", "Fine if the cat is large"],
        answer: "Extremely toxic and potentially fatal to cats",
      },
    ],
    Burns: [
      {
        question: "A cat with a burn should have the area cooled with:",
        options: ["Cool running water for at least 10 minutes", "Ice cubes placed directly on the skin", "A warm wet cloth", "Butter or cooking oil"],
        answer: "Cool running water for at least 10 minutes",
      },
      {
        question: "After cooling a cat's burn, the wound should be covered with:",
        options: ["A clean non-adhesive dressing", "Plastic wrap tied tightly", "Nothing — leave it open to the air", "A thick layer of bandage"],
        answer: "A clean non-adhesive dressing",
      },
      {
        question: "Chemical burns on a cat require:",
        options: ["Rinsing with plenty of water and urgent vet care", "Wiping with a dry cloth only", "Applying baking soda", "No special treatment"],
        answer: "Rinsing with plenty of water and urgent vet care",
      },
      {
        question: "Which part of a cat is most commonly burned by household hazards?",
        options: ["Paws from hot surfaces or chemicals", "The back", "The ears", "The tail only"],
        answer: "Paws from hot surfaces or chemicals",
      },
      {
        question: "Sunburn in cats most often affects:",
        options: ["Pale-skinned or white-furred areas, especially ear tips", "Dark-furred areas", "The belly", "The back legs"],
        answer: "Pale-skinned or white-furred areas, especially ear tips",
      },
    ],
    Fracture: [
      {
        question: "A cat with a suspected fracture should be transported by:",
        options: ["Placing it in a box lined with a soft towel with minimal movement", "Carrying it by the injured limb", "Letting it walk on its own", "Lifting it by the scruff only"],
        answer: "Placing it in a box lined with a soft towel with minimal movement",
      },
      {
        question: "A cat that has been hit by a car should be:",
        options: ["Assessed for fractures and internal injuries and taken to a vet immediately", "Left to recover on its own if walking", "Given food and water first", "Kept outdoors to move around freely"],
        answer: "Assessed for fractures and internal injuries and taken to a vet immediately",
      },
      {
        question: "What sign suggests a cat may have a spinal injury?",
        options: ["Dragging its back legs", "Running faster than usual", "Crying when touched on the tail", "Refusing food for one meal"],
        answer: "Dragging its back legs",
      },
      {
        question: "You should try to splint a cat's broken bone at home:",
        options: ["Never — improper splinting can cause more harm", "Always, before going to the vet", "Only for the front legs", "If the bone is not visible"],
        answer: "Never — improper splinting can cause more harm",
      },
      {
        question: "A cat in pain from a fracture may:",
        options: ["Hiss, bite, or scratch when approached", "Seek affection immediately", "Eat more than normal", "Jump and climb as usual"],
        answer: "Hiss, bite, or scratch when approached",
      },
    ],
    Seizure: [
      {
        question: "During a cat seizure, you should keep the cat away from:",
        options: ["Stairs, furniture edges, and hard surfaces", "Soft bedding", "Natural daylight", "Other pets watching calmly"],
        answer: "Stairs, furniture edges, and hard surfaces",
      },
      {
        question: "Touching a cat's mouth during a seizure:",
        options: ["Risks a serious bite and should be avoided", "Helps stop the seizure faster", "Is safe if done gently", "Is recommended to keep the airway open"],
        answer: "Risks a serious bite and should be avoided",
      },
      {
        question: "After a cat seizure ends, the cat will likely be:",
        options: ["Dazed, confused, and disoriented for a short time", "Completely normal and playful immediately", "Hungry and loud", "Ready to go outside"],
        answer: "Dazed, confused, and disoriented for a short time",
      },
      {
        question: "Multiple seizures within 24 hours in a cat is called:",
        options: ["Cluster seizures — an emergency requiring immediate vet care", "Normal variation", "A mild stress response", "Post-vaccination reaction always"],
        answer: "Cluster seizures — an emergency requiring immediate vet care",
      },
      {
        question: "Common causes of seizures in cats include:",
        options: ["Toxins, brain disease, or metabolic problems", "Too much exercise", "Eating too fast", "Exposure to rain"],
        answer: "Toxins, brain disease, or metabolic problems",
      },
    ],
    Heatstroke: [
      {
        question: "Cats are less prone to heatstroke than dogs, but are at risk when:",
        options: ["Trapped in a hot enclosed space like a car or small room", "Playing outside in mild weather", "Eating dry food", "Sleeping in a shaded area"],
        answer: "Trapped in a hot enclosed space like a car or small room",
      },
      {
        question: "A cat with heatstroke should be moved to:",
        options: ["A cool, well-ventilated area immediately", "A warmer room to avoid temperature shock", "Direct sunlight to keep it conscious", "Outdoors for fresh air only"],
        answer: "A cool, well-ventilated area immediately",
      },
      {
        question: "Which of these is appropriate first aid for a cat with heatstroke?",
        options: ["Dampen the coat with cool water and fan gently", "Submerge the cat fully in cold water", "Wrap it in a wet hot towel", "Give it ice to eat"],
        answer: "Dampen the coat with cool water and fan gently",
      },
      {
        question: "A cat's normal body temperature is approximately:",
        options: ["38–39.2°C (100.5–102.5°F)", "35°C (95°F)", "41°C (106°F)", "37°C (98.6°F)"],
        answer: "38–39.2°C (100.5–102.5°F)",
      },
      {
        question: "After cooling a cat with heatstroke, you should:",
        options: ["Still take it to a vet — internal effects may not be visible", "Monitor at home for 48 hours", "Feed it a large meal", "Let it go back outside"],
        answer: "Still take it to a vet — internal effects may not be visible",
      },
    ],
    Unconscious: [
      {
        question: "An unconscious cat's airway should be checked by:",
        options: ["Gently extending the neck and looking in the mouth for obstructions", "Pressing on its belly", "Pouring water into its mouth", "Blowing hard into its nose"],
        answer: "Gently extending the neck and looking in the mouth for obstructions",
      },
      {
        question: "If a cat is unconscious and not breathing, you should:",
        options: ["Start rescue breathing and contact a vet immediately", "Wait 15 minutes before acting", "Put it somewhere warm and quiet", "Give it food"],
        answer: "Start rescue breathing and contact a vet immediately",
      },
      {
        question: "To check for a heartbeat in an unconscious cat, place your hand:",
        options: ["On the left side of the chest, just behind the front leg", "On top of the head", "On the belly", "Under the chin"],
        answer: "On the left side of the chest, just behind the front leg",
      },
      {
        question: "An unconscious cat should be placed in the recovery position:",
        options: ["On its side with the head slightly lower than the body if breathing", "On its back with legs in the air", "In a sitting position", "Upside down"],
        answer: "On its side with the head slightly lower than the body if breathing",
      },
      {
        question: "Which scenario most commonly leads to unconsciousness in cats?",
        options: ["Trauma, severe poisoning, or oxygen deprivation", "Missing a meal", "Sleeping too long", "Being overly playful"],
        answer: "Trauma, severe poisoning, or oxygen deprivation",
      },
    ],
  },
  Bird: {
    Bleeding: [
      {
        question: "If a bird is bleeding from a broken blood feather, you should:",
        options: ["Apply styptic powder or cornstarch to the feather shaft", "Pull out the feather immediately without any preparation", "Leave it and hope it stops on its own", "Soak the bird in water"],
        answer: "Apply styptic powder or cornstarch to the feather shaft",
      },
      {
        question: "A broken blood feather in a bird that keeps bleeding may need to be:",
        options: ["Removed carefully with blunt forceps — a vet can assist", "Left in permanently", "Cut with scissors", "Wrapped in tape"],
        answer: "Removed carefully with blunt forceps — a vet can assist",
      },
      {
        question: "Birds can go into shock from blood loss more quickly than mammals because:",
        options: ["Their total blood volume is very small relative to their body size", "Their blood does not clot at all", "They have thin feathers", "They breathe faster"],
        answer: "Their total blood volume is very small relative to their body size",
      },
      {
        question: "What should you do if a bird has a wound that is actively bleeding?",
        options: ["Apply gentle direct pressure and seek vet care immediately", "Let the bird bathe to clean the wound", "Sprinkle salt on the wound", "Cover the whole bird in bandages"],
        answer: "Apply gentle direct pressure and seek vet care immediately",
      },
      {
        question: "To minimise stress on a bleeding bird while transporting it to a vet:",
        options: ["Place it in a small dark box at a warm temperature", "Let it fly around a large cage", "Expose it to loud music to keep it alert", "Give it fruits to restore energy"],
        answer: "Place it in a small dark box at a warm temperature",
      },
    ],
    Fracture: [
      {
        question: "A bird with a leg fracture should be placed in:",
        options: ["A small container that limits movement", "A large cage for exercise", "A bowl of water", "A cold dark room"],
        answer: "A small container that limits movement",
      },
      {
        question: "Wing droop in a bird most commonly suggests:",
        options: ["A wing fracture or dislocation", "Normal resting posture", "Being sleepy", "Overeating"],
        answer: "A wing fracture or dislocation",
      },
      {
        question: "You should attempt to splint a bird's broken bone at home:",
        options: ["Only if directed to by a vet over the phone", "Never under any circumstances", "Always to save time", "Only for large birds like parrots"],
        answer: "Only if directed to by a vet over the phone",
      },
      {
        question: "When handling a bird with a suspected fracture, you should:",
        options: ["Wrap it gently in a soft cloth to restrict movement", "Let it perch normally", "Encourage it to use the injured limb", "Hold it tightly upright"],
        answer: "Wrap it gently in a soft cloth to restrict movement",
      },
      {
        question: "A bird that has flown into a window should be:",
        options: ["Placed in a quiet dark box and monitored — taken to a vet if not recovered in 1 hour", "Left outside", "Given water immediately", "Returned to its outdoor cage"],
        answer: "Placed in a quiet dark box and monitored — taken to a vet if not recovered in 1 hour",
      },
    ],
    Poisoning: [
      {
        question: "Birds are extremely sensitive to fumes from:",
        options: ["Non-stick (PTFE/Teflon) cookware when overheated", "Boiling plain water", "Fruit", "Plant-based candles"],
        answer: "Non-stick (PTFE/Teflon) cookware when overheated",
      },
      {
        question: "If a bird is exposed to toxic fumes, you should immediately:",
        options: ["Move it to fresh air and contact a vet", "Give it water to drink", "Put it near a fan on high speed", "Cover its cage to protect it"],
        answer: "Move it to fresh air and contact a vet",
      },
      {
        question: "Which food is toxic to most pet birds?",
        options: ["Avocado", "Cooked plain pasta", "Apple flesh", "Leafy greens"],
        answer: "Avocado",
      },
      {
        question: "Signs of poisoning in a bird include:",
        options: ["Trembling, laboured breathing, and falling off the perch", "Singing louder than usual", "Eating and drinking normally", "Preening more often"],
        answer: "Trembling, laboured breathing, and falling off the perch",
      },
      {
        question: "Household aerosols and sprays near birds can cause:",
        options: ["Respiratory distress and sudden death", "Temporary excitability", "Increased feather growth", "No harm if briefly exposed"],
        answer: "Respiratory distress and sudden death",
      },
    ],
    Choking: [
      {
        question: "A bird struggling to breathe with its beak open may indicate:",
        options: ["Respiratory distress or an airway obstruction", "Normal panting after exercise", "Over-excitement", "Excessive singing"],
        answer: "Respiratory distress or an airway obstruction",
      },
      {
        question: "If a bird appears to be choking, the appropriate action is:",
        options: ["Hold it gently upright and seek vet help immediately", "Give it water through a dropper", "Tap its back hard", "Let it resolve on its own"],
        answer: "Hold it gently upright and seek vet help immediately",
      },
      {
        question: "Tail-bobbing in a bird is a sign of:",
        options: ["Laboured breathing that may indicate a blocked airway", "Normal playful movement", "Good health and activity", "Grooming behaviour"],
        answer: "Laboured breathing that may indicate a blocked airway",
      },
      {
        question: "The safest way to transport a bird with suspected choking is:",
        options: ["Upright in a small ventilated box at room temperature", "In a plastic bag", "In a closed jar with air holes", "Carried in an open hand outdoors"],
        answer: "Upright in a small ventilated box at room temperature",
      },
      {
        question: "Seeds that are too large can be a choking hazard for:",
        options: ["Small birds like budgerigars and finches", "All birds equally", "Only sick birds", "Birds that are overweight"],
        answer: "Small birds like budgerigars and finches",
      },
    ],
    Burns: [
      {
        question: "A bird that has been burned should have the area:",
        options: ["Gently rinsed with cool water and the bird kept warm", "Covered in oil", "Exposed to sunlight to dry", "Rubbed with a cloth"],
        answer: "Gently rinsed with cool water and the bird kept warm",
      },
      {
        question: "Birds commonly suffer burns from:",
        options: ["Landing on hot stovetops or light bulbs", "Bathing in cool water", "Eating hot food", "Flying near windows"],
        answer: "Landing on hot stovetops or light bulbs",
      },
      {
        question: "After first aid for a burn, a bird should be:",
        options: ["Taken to a vet as burns in birds are serious", "Left to rest in its cage for a week", "Given extra food", "Kept in a cold room"],
        answer: "Taken to a vet as burns in birds are serious",
      },
      {
        question: "To prevent burns, bird owners should:",
        options: ["Supervise free flight time and keep birds away from the kitchen", "Never let birds out of their cage", "Only have birds in air-conditioned rooms", "Feed birds hot food to acclimatise them"],
        answer: "Supervise free flight time and keep birds away from the kitchen",
      },
      {
        question: "Electric shock or wire burns in birds require:",
        options: ["Immediate vet care even if the bird appears unharmed", "A few days' observation at home", "Salt water rinse only", "No treatment if the bird is awake"],
        answer: "Immediate vet care even if the bird appears unharmed",
      },
    ],
    Seizure: [
      {
        question: "A bird having a seizure should be placed on:",
        options: ["A soft flat surface away from perches and hard objects", "Its perch to feel secure", "A towel in a bucket of water", "In its food bowl"],
        answer: "A soft flat surface away from perches and hard objects",
      },
      {
        question: "Seizures in birds are commonly triggered by:",
        options: ["Nutritional deficiencies, toxins, or infections", "Eating too much seed", "Singing too much", "Normal moult cycles"],
        answer: "Nutritional deficiencies, toxins, or infections",
      },
      {
        question: "After a bird seizure, the bird should be:",
        options: ["Kept warm, calm, and taken to a vet promptly", "Put back on its perch to recover alone", "Given fruit juice for energy", "Exposed to daylight immediately"],
        answer: "Kept warm, calm, and taken to a vet promptly",
      },
      {
        question: "Vitamin E and selenium deficiency in birds can cause:",
        options: ["Neurological symptoms including seizures", "Improved feather colour only", "Excessive vocalisation", "No symptoms at all"],
        answer: "Neurological symptoms including seizures",
      },
      {
        question: "When a bird is seizing, you should avoid:",
        options: ["Restraining it tightly or putting objects near its beak", "Staying nearby to monitor it", "Reducing noise and light", "Recording the duration"],
        answer: "Restraining it tightly or putting objects near its beak",
      },
    ],
    Heatstroke: [
      {
        question: "Birds show overheating by:",
        options: ["Holding wings away from the body and open-mouth breathing", "Singing more than usual", "Preening quietly", "Perching with one leg up"],
        answer: "Holding wings away from the body and open-mouth breathing",
      },
      {
        question: "To cool an overheated bird safely, you can:",
        options: ["Mist it lightly with cool water and move it to shade", "Submerge it in cold water", "Place it in a freezer briefly", "Put it in direct front of an air conditioning vent"],
        answer: "Mist it lightly with cool water and move it to shade",
      },
      {
        question: "What is a safe ambient temperature range for most pet birds?",
        options: ["18–27°C (65–80°F)", "10–15°C (50–59°F)", "35–40°C (95–104°F)", "Above 40°C (104°F)"],
        answer: "18–27°C (65–80°F)",
      },
      {
        question: "A bird that has collapsed from heat should be:",
        options: ["Taken to a vet urgently after gentle cooling", "Left in the sun to recover naturally", "Given cold water to drink immediately", "Placed in a sealed cool container"],
        answer: "Taken to a vet urgently after gentle cooling",
      },
      {
        question: "Bird cages should never be placed:",
        options: ["In direct sunlight without shade or ventilation", "Near a window with partial shade", "In a room-temperature indoor space", "Near a ceiling fan on low speed"],
        answer: "In direct sunlight without shade or ventilation",
      },
    ],
    Unconscious: [
      {
        question: "An unconscious bird found on the ground should first be:",
        options: ["Placed in a small dark warm box and monitored", "Left where it is", "Given water by dropper immediately", "Placed back in a high cage"],
        answer: "Placed in a small dark warm box and monitored",
      },
      {
        question: "To check if an unconscious bird is breathing, look for:",
        options: ["Movement of the chest or tail feathers", "Eye movement only", "Colour of the beak", "Wing position"],
        answer: "Movement of the chest or tail feathers",
      },
      {
        question: "The optimal temperature for keeping an unconscious bird stable is:",
        options: ["Around 30–32°C (86–90°F)", "Below 20°C (68°F)", "Above 40°C (104°F)", "Room temperature at 24°C is always fine"],
        answer: "Around 30–32°C (86–90°F)",
      },
      {
        question: "An unconscious bird should be taken to a vet:",
        options: ["As soon as possible — do not wait for it to revive on its own", "Only if it has not woken after 24 hours", "Only if it shows visible injuries", "After giving it 4 hours to rest"],
        answer: "As soon as possible — do not wait for it to revive on its own",
      },
      {
        question: "While waiting for vet care, an unconscious bird should be kept:",
        options: ["Quiet, warm, and undisturbed with minimal handling", "In the company of other birds for comfort", "In bright light to stimulate waking", "With food placed in its beak"],
        answer: "Quiet, warm, and undisturbed with minimal handling",
      },
    ],
  },
  Rabbit: {
    Bleeding: [
      {
        question: "If a rabbit is bleeding, you should apply pressure using:",
        options: ["Clean gauze or a soft cloth", "A rough towel", "Wet newspaper", "Nothing — rabbits heal fast"],
        answer: "Clean gauze or a soft cloth",
      },
      {
        question: "Rabbits can go into shock quickly from blood loss because:",
        options: ["They have a high heart rate and small blood volume", "They are very fragile emotionally", "Their fur absorbs blood slowly", "They have thin skin"],
        answer: "They have a high heart rate and small blood volume",
      },
      {
        question: "Blood in a rabbit's urine may indicate:",
        options: ["A urinary tract issue or internal injury requiring vet care", "Normal hydration", "A dietary response to vegetables", "Overheating"],
        answer: "A urinary tract issue or internal injury requiring vet care",
      },
      {
        question: "After controlling external bleeding in a rabbit, you should:",
        options: ["See a vet to check for underlying injuries", "Wait 48 hours to see if healing occurs", "Give it extra food", "Restrict its water intake"],
        answer: "See a vet to check for underlying injuries",
      },
      {
        question: "A rabbit that has been attacked by a predator may have hidden injuries that:",
        options: ["Require a vet check even if only minor surface wounds are visible", "Will heal on their own without any help", "Are less serious if the rabbit is moving normally", "Only affect the fur and not deeper tissue"],
        answer: "Require a vet check even if only minor surface wounds are visible",
      },
    ],
    Fracture: [
      {
        question: "Rabbits are prone to spinal fractures because:",
        options: ["They have powerful hind legs and can injure themselves if they kick forcefully", "Their bones are extremely soft", "They jump too high", "Their cages are usually too small"],
        answer: "They have powerful hind legs and can injure themselves if they kick forcefully",
      },
      {
        question: "A rabbit with a spinal injury may show:",
        options: ["Paralysis or weakness of the hindquarters", "Normal hopping and movement", "Increased appetite", "Constant circling"],
        answer: "Paralysis or weakness of the hindquarters",
      },
      {
        question: "When transporting a rabbit with a suspected fracture to the vet, use:",
        options: ["A firm-bottomed carrier with soft bedding to restrict movement", "A loose cardboard box", "Your arms only", "A loose pillowcase"],
        answer: "A firm-bottomed carrier with soft bedding to restrict movement",
      },
      {
        question: "The most common cause of fractures in pet rabbits is:",
        options: ["Dropping or mishandling by a human", "Running too fast", "Climbing too high", "Eating hard food"],
        answer: "Dropping or mishandling by a human",
      },
      {
        question: "You should NOT do which of the following if a rabbit has a fracture?",
        options: ["Allow it to thrash or jump in an open area", "Keep it calm and still", "Seek immediate vet care", "Handle it gently and minimise movement"],
        answer: "Allow it to thrash or jump in an open area",
      },
    ],
    Poisoning: [
      {
        question: "Which common garden plant is toxic to rabbits?",
        options: ["Foxglove", "Grass", "Dandelion leaves", "Hay"],
        answer: "Foxglove",
      },
      {
        question: "If a rabbit has eaten a suspected toxic plant, you should:",
        options: ["Contact a vet immediately and bring a sample of the plant if possible", "Wait 24 hours to see if symptoms appear", "Give it water and keep it warm", "Feed it more hay to dilute the toxin"],
        answer: "Contact a vet immediately and bring a sample of the plant if possible",
      },
      {
        question: "Rhubarb leaves are:",
        options: ["Toxic to rabbits and should never be given", "Safe in small amounts", "A good source of vitamins for rabbits", "Only toxic to cats"],
        answer: "Toxic to rabbits and should never be given",
      },
      {
        question: "Signs of poisoning in a rabbit include:",
        options: ["Lethargy, loss of appetite, and abnormal droppings", "Extra energy and grooming", "Louder thumping", "Eating and drinking normally"],
        answer: "Lethargy, loss of appetite, and abnormal droppings",
      },
      {
        question: "Household cleaning products near a rabbit's hutch or living area can cause:",
        options: ["Respiratory irritation and toxic ingestion if surfaces are licked", "No harm at all", "Better coat condition", "Increased grooming only"],
        answer: "Respiratory irritation and toxic ingestion if surfaces are licked",
      },
    ],
    Choking: [
      {
        question: "Rabbits are at choking risk mainly from:",
        options: ["Eating too fast or attempting to swallow large food pieces", "Drinking water", "Running in their enclosure", "Playing with toys"],
        answer: "Eating too fast or attempting to swallow large food pieces",
      },
      {
        question: "A rabbit that is gurgling or gasping with neck extended may be:",
        options: ["Choking or having a respiratory emergency", "About to groom", "Stretching normally", "Making a happy noise"],
        answer: "Choking or having a respiratory emergency",
      },
      {
        question: "If you suspect a rabbit is choking, you should:",
        options: ["Call a vet immediately — home intervention is risky in rabbits", "Try to reach into the mouth with your fingers", "Shake the rabbit vigorously", "Give it water"],
        answer: "Call a vet immediately — home intervention is risky in rabbits",
      },
      {
        question: "Rabbits are obligate nasal breathers, which means:",
        options: ["Any nasal blockage can quickly become a breathing emergency", "They prefer breathing through the mouth", "Their nose is not used for breathing", "They can hold their breath for a long time"],
        answer: "Any nasal blockage can quickly become a breathing emergency",
      },
      {
        question: "Mucus or discharge from a rabbit's nose combined with breathing difficulty may indicate:",
        options: ["A respiratory infection or blockage requiring vet care", "Normal seasonal change", "Over-excitement", "A dietary issue only"],
        answer: "A respiratory infection or blockage requiring vet care",
      },
    ],
    Burns: [
      {
        question: "If a rabbit has a small burn, the immediate first aid is to:",
        options: ["Cool with clean cool water for 10 minutes then see a vet", "Apply butter to soothe the skin", "Cover with a thick bandage immediately", "Leave it and monitor for a week"],
        answer: "Cool with clean cool water for 10 minutes then see a vet",
      },
      {
        question: "Rabbit skin is particularly sensitive to burns because:",
        options: ["It is thinner and more delicate than many other animals", "Rabbits have no nerve endings in the skin", "Their fur prevents all burning", "They do not produce natural oils"],
        answer: "It is thinner and more delicate than many other animals",
      },
      {
        question: "Electric heating pads used with rabbits should always:",
        options: ["Have a cloth cover to prevent direct contact burns", "Be set to the highest temperature for warmth", "Be placed under the entire cage floor", "Never be used at all"],
        answer: "Have a cloth cover to prevent direct contact burns",
      },
      {
        question: "After a rabbit has a burn, it is important to prevent it from:",
        options: ["Grooming the burned area", "Sleeping", "Drinking water", "Moving around gently"],
        answer: "Grooming the burned area",
      },
      {
        question: "Burns in rabbits should be treated by a vet because:",
        options: ["Infection and pain management require professional treatment", "Home bandaging is always sufficient", "Rabbit burns always heal within 24 hours", "Vets have no special treatments for burns"],
        answer: "Infection and pain management require professional treatment",
      },
    ],
    Seizure: [
      {
        question: "Rabbits can have seizures triggered by:",
        options: ["Encephalitozoon cuniculi (E. cuniculi) parasite infection", "Eating too many vegetables", "Sleeping too much", "Normal excitement"],
        answer: "Encephalitozoon cuniculi (E. cuniculi) parasite infection",
      },
      {
        question: "During a rabbit seizure, you should:",
        options: ["Clear the area of hazards and observe without restraining", "Hold the rabbit firmly to stop movement", "Put it in water to calm it", "Give it food"],
        answer: "Clear the area of hazards and observe without restraining",
      },
      {
        question: "Head tilt in a rabbit combined with circling can indicate:",
        options: ["Vestibular disease or E. cuniculi infection — vet care is needed", "Normal curiosity behaviour", "A need for more exercise", "A response to a new food"],
        answer: "Vestibular disease or E. cuniculi infection — vet care is needed",
      },
      {
        question: "After a rabbit recovers from a seizure it should be:",
        options: ["Taken to a vet for diagnosis even if it seems back to normal", "Given 3 days to recover at home first", "Fed immediately to restore energy", "Put in a dark room for a week"],
        answer: "Taken to a vet for diagnosis even if it seems back to normal",
      },
      {
        question: "Sudden unexplained seizures in an older rabbit most commonly point to:",
        options: ["An underlying condition such as E. cuniculi, stroke, or brain lesion", "Excitement from play", "Dehydration from missing one water session", "Normal ageing with no cause"],
        answer: "An underlying condition such as E. cuniculi, stroke, or brain lesion",
      },
    ],
    Heatstroke: [
      {
        question: "Rabbits are very vulnerable to heatstroke because:",
        options: ["They cannot pant effectively to regulate body temperature", "They prefer hot climates", "Their fur is very thin", "They drink too little water"],
        answer: "They cannot pant effectively to regulate body temperature",
      },
      {
        question: "The safest temperature range for domestic rabbits is approximately:",
        options: ["10–20°C (50–68°F)", "30–35°C (86–95°F)", "Above 35°C (95°F)", "Below 5°C (41°F)"],
        answer: "10–20°C (50–68°F)",
      },
      {
        question: "Early signs of heatstroke in a rabbit include:",
        options: ["Rapid breathing, wet nose, and lethargy", "Extra grooming and eating more", "Thumping loudly", "Normal behaviour with no changes"],
        answer: "Rapid breathing, wet nose, and lethargy",
      },
      {
        question: "To cool a rabbit with heatstroke, you should:",
        options: ["Apply cool damp cloths to the ears and body and seek vet care immediately", "Submerge the rabbit in cold water", "Place it on a block of ice", "Give it a cold bath fully submerged"],
        answer: "Apply cool damp cloths to the ears and body and seek vet care immediately",
      },
      {
        question: "Rabbit hutches outdoors in summer should be:",
        options: ["Placed in shade with ventilation and fresh water always available", "Placed in direct afternoon sun for warmth", "Covered with a black tarp", "Left without water for short periods"],
        answer: "Placed in shade with ventilation and fresh water always available",
      },
    ],
    Unconscious: [
      {
        question: "A rabbit found lying on its side and unresponsive may be in:",
        options: ["A state of shock or be critically unwell — contact a vet immediately", "A deep sleep and should not be disturbed", "A normal resting pose called 'binkying'", "A response to eating too much"],
        answer: "A state of shock or be critically unwell — contact a vet immediately",
      },
      {
        question: "To check if an unconscious rabbit is breathing, observe:",
        options: ["Chest and flank movement", "Eye blinking", "Ear position", "Colour of the fur"],
        answer: "Chest and flank movement",
      },
      {
        question: "GI stasis in a rabbit can progress to unconsciousness. It is caused by:",
        options: ["A slowdown or stoppage of the digestive system — a vet emergency", "Eating too fast", "Normal overnight fasting", "Cold weather alone"],
        answer: "A slowdown or stoppage of the digestive system — a vet emergency",
      },
      {
        question: "An unconscious rabbit should be kept:",
        options: ["On its side in a warm quiet space while you contact a vet", "In a cold room to prevent further issues", "In a bathtub of water", "In a drafty area for fresh air"],
        answer: "On its side in a warm quiet space while you contact a vet",
      },
      {
        question: "Which of the following could cause a rabbit to lose consciousness?",
        options: ["Severe stress, hypothermia, poisoning, or internal injury", "Being picked up gently", "Eating vegetables", "Normal sleep patterns"],
        answer: "Severe stress, hypothermia, poisoning, or internal injury",
      },
    ],
  },
  Other: {
    Bleeding: [
      {
        question: "What is the most important first step when any pet is bleeding?",
        options: ["Apply direct pressure with a clean cloth", "Pour cold water on the wound", "Give the pet food to restore strength", "Leave the wound open to the air"],
        answer: "Apply direct pressure with a clean cloth",
      },
      {
        question: "How long should you maintain pressure on a bleeding wound?",
        options: ["At least 3–5 minutes without lifting", "10 seconds", "Until the pet moves away", "Only until you find a bandage"],
        answer: "At least 3–5 minutes without lifting",
      },
      {
        question: "Which material is best for applying pressure to a bleeding wound?",
        options: ["Sterile gauze or a clean cloth", "Cotton wool placed directly in the wound", "Adhesive tape without padding", "A paper towel soaked in vinegar"],
        answer: "Sterile gauze or a clean cloth",
      },
      {
        question: "After controlling a pet's bleeding, the next step should be:",
        options: ["Transport to a vet for professional assessment", "Feed the pet to help recovery", "Monitor at home for 72 hours", "Apply more and more bandaging layers"],
        answer: "Transport to a vet for professional assessment",
      },
      {
        question: "Signs of internal bleeding in a pet include:",
        options: ["Pale gums, weakness, a distended abdomen, and rapid breathing", "Normal activity and eating", "Loud vocalisation only", "Excessive drinking"],
        answer: "Pale gums, weakness, a distended abdomen, and rapid breathing",
      },
    ],
    Fracture: [
      {
        question: "If you suspect a pet has a broken bone, your first action should be:",
        options: ["Keep the pet calm and restrict movement", "Massage the injured area", "Encourage the pet to walk", "Splint it at home with any available materials"],
        answer: "Keep the pet calm and restrict movement",
      },
      {
        question: "An open fracture (visible bone) is:",
        options: ["A veterinary emergency requiring immediate care", "Less serious than a closed fracture", "Safe to clean and bandage at home", "Only serious in large animals"],
        answer: "A veterinary emergency requiring immediate care",
      },
      {
        question: "To transport a pet with a suspected fracture safely, you should:",
        options: ["Use a flat rigid surface and minimise movement of the limb", "Carry it in your arms without support", "Let it hop or crawl on its own", "Hold only the injured limb"],
        answer: "Use a flat rigid surface and minimise movement of the limb",
      },
      {
        question: "Attempting to set a broken bone at home is:",
        options: ["Dangerous and should never be done", "Fine if done gently", "Recommended before going to the vet", "Safe only for small fractures"],
        answer: "Dangerous and should never be done",
      },
      {
        question: "Swelling, deformity, and unwillingness to bear weight on a limb are signs of:",
        options: ["A possible fracture requiring vet evaluation", "Mild muscle soreness", "Normal ageing joints", "An insect sting only"],
        answer: "A possible fracture requiring vet evaluation",
      },
    ],
    Poisoning: [
      {
        question: "If you suspect a pet has been poisoned, the very first thing to do is:",
        options: ["Call a vet or pet poison hotline immediately", "Induce vomiting at home", "Give the pet milk to neutralise the toxin", "Wait and observe for 24 hours"],
        answer: "Call a vet or pet poison hotline immediately",
      },
      {
        question: "Common signs of poisoning in pets include:",
        options: ["Vomiting, drooling, tremors, and lethargy", "Increased energy and appetite", "Normal behaviour with bright eyes", "Louder than usual vocalisations"],
        answer: "Vomiting, drooling, tremors, and lethargy",
      },
      {
        question: "When contacting a vet about a potential poisoning, you should tell them:",
        options: ["What the pet ate, how much, and when", "Only the current symptoms", "Nothing until examined in person", "Whether the pet has eaten recently"],
        answer: "What the pet ate, how much, and when",
      },
      {
        question: "Inducing vomiting in a poisoned pet at home is:",
        options: ["Dangerous without vet guidance — some toxins cause more harm if vomited", "Always the correct first step", "Safe for any type of poisoning", "Recommended within 30 minutes of ingestion regardless"],
        answer: "Dangerous without vet guidance — some toxins cause more harm if vomited",
      },
      {
        question: "Household plants, cleaning products, and human medications are common causes of:",
        options: ["Accidental pet poisoning", "Improved pet health", "Improved coat condition", "No known pet health issues"],
        answer: "Accidental pet poisoning",
      },
    ],
    Choking: [
      {
        question: "The first thing to do if a pet is choking is:",
        options: ["Look in the mouth carefully for a visible obstruction", "Give it water", "Hold it upside down for 10 minutes", "Put food in its mouth"],
        answer: "Look in the mouth carefully for a visible obstruction",
      },
      {
        question: "If a visible obstruction can be seen in a pet's mouth:",
        options: ["Carefully remove it only if it can be done without pushing it deeper", "Reach in immediately without looking", "Pull on anything you can feel", "Leave it for a vet only"],
        answer: "Carefully remove it only if it can be done without pushing it deeper",
      },
      {
        question: "A pet that is pawing at its face and retching is likely:",
        options: ["Choking on an obstruction", "Playing", "Hungry", "Trying to groom"],
        answer: "Choking on an obstruction",
      },
      {
        question: "If you cannot remove a choking obstruction safely, you should:",
        options: ["Go to an emergency vet immediately", "Wait and see if it clears itself", "Give the pet more food to push it down", "Pour water into the mouth"],
        answer: "Go to an emergency vet immediately",
      },
      {
        question: "After successfully removing a choking obstruction from a pet, you should:",
        options: ["Still visit a vet to check for injury to the throat", "Give extra food as a reward", "Let it rest for a week without any check-up", "Assume it is completely fine"],
        answer: "Still visit a vet to check for injury to the throat",
      },
    ],
    Burns: [
      {
        question: "The correct first aid for a pet burn is to:",
        options: ["Cool the area with clean cool running water for 10 minutes", "Apply ice directly to the burn", "Rub with a dry cloth", "Cover immediately with a thick bandage"],
        answer: "Cool the area with clean cool running water for 10 minutes",
      },
      {
        question: "Which substance should you NEVER apply to a pet's burn?",
        options: ["Butter, oil, or toothpaste", "Cool clean water", "A clean non-adhesive dressing", "Nothing before the vet"],
        answer: "Butter, oil, or toothpaste",
      },
      {
        question: "After first aid for a burn, a pet should be:",
        options: ["Seen by a vet — burns are prone to infection and pain", "Left to heal at home for at least a week", "Given extra food to promote healing", "Kept in a warm sunny spot"],
        answer: "Seen by a vet — burns are prone to infection and pain",
      },
      {
        question: "Chemical burns require:",
        options: ["Rinsing with large amounts of water and urgent vet care", "Vinegar applied to neutralise the chemical", "Covering with a dry cloth only", "No action if the pet is not in obvious pain"],
        answer: "Rinsing with large amounts of water and urgent vet care",
      },
      {
        question: "How can you tell a burn is serious enough to require emergency vet care?",
        options: ["Any burn larger than a small patch, or involving the face, paws, or genitals", "Only if there is severe bleeding", "Only if the pet is unconscious", "A burn is never an emergency"],
        answer: "Any burn larger than a small patch, or involving the face, paws, or genitals",
      },
    ],
    Seizure: [
      {
        question: "During a pet seizure, your priority is to:",
        options: ["Clear the area of hazards and protect the pet from injury", "Hold the pet still to stop the seizure", "Put something in the pet's mouth", "Splash water on the pet to revive it"],
        answer: "Clear the area of hazards and protect the pet from injury",
      },
      {
        question: "A seizure lasting more than 5 minutes is called status epilepticus and is:",
        options: ["A life-threatening emergency requiring immediate vet care", "Normal for a first seizure", "Safe as long as the pet is comfortable", "Only serious in old animals"],
        answer: "A life-threatening emergency requiring immediate vet care",
      },
      {
        question: "It is important to time a seizure because:",
        options: ["Duration helps the vet assess severity and plan treatment", "Timing helps decide whether to feed the pet", "Short seizures do not need any vet care", "Timing has no medical relevance"],
        answer: "Duration helps the vet assess severity and plan treatment",
      },
      {
        question: "After a seizure, the post-ictal phase may cause a pet to be:",
        options: ["Confused, temporarily blind, or uncoordinated for minutes to hours", "Immediately back to normal", "More energetic than before", "Able to recall the seizure"],
        answer: "Confused, temporarily blind, or uncoordinated for minutes to hours",
      },
      {
        question: "If a pet has never had a seizure before and has one, you should:",
        options: ["See a vet to identify the underlying cause", "Assume it was a one-off and monitor at home indefinitely", "Change its diet immediately", "Give a human anti-seizure medication"],
        answer: "See a vet to identify the underlying cause",
      },
    ],
    Heatstroke: [
      {
        question: "The key first aid step for a pet with heatstroke is:",
        options: ["Move to a cool area and apply cool (not ice cold) water", "Wrap in a warm blanket", "Give ice cubes to eat", "Keep in direct sunlight"],
        answer: "Move to a cool area and apply cool (not ice cold) water",
      },
      {
        question: "Using ice water or ice packs on a pet with heatstroke is dangerous because:",
        options: ["It causes blood vessels to constrict and can worsen heat retention", "It works too slowly", "Pets dislike the sensation", "It is only dangerous for large pets"],
        answer: "It causes blood vessels to constrict and can worsen heat retention",
      },
      {
        question: "Signs of heatstroke in a pet include:",
        options: ["Heavy panting, drooling, weakness, and red gums", "Sleeping more than usual", "Normal eating and drinking", "Extra playfulness"],
        answer: "Heavy panting, drooling, weakness, and red gums",
      },
      {
        question: "After emergency cooling, a pet that has suffered heatstroke should:",
        options: ["Still receive vet care as organ damage can occur internally", "Rest at home for 48 hours before any vet visit", "Be fed a large meal", "Return to normal activity the next day"],
        answer: "Still receive vet care as organ damage can occur internally",
      },
      {
        question: "Leaving a pet in a parked car on a warm day is dangerous because:",
        options: ["Temperatures inside cars rise rapidly and can cause fatal heatstroke", "Cars have insufficient oxygen", "Pets are scared in cars", "The seat material can cause burns"],
        answer: "Temperatures inside cars rise rapidly and can cause fatal heatstroke",
      },
    ],
    Unconscious: [
      {
        question: "If a pet is unconscious, the very first step is to:",
        options: ["Check for breathing and a heartbeat", "Give food or water", "Shake it vigorously to wake it up", "Check the temperature outdoors"],
        answer: "Check for breathing and a heartbeat",
      },
      {
        question: "An unconscious pet that is breathing should be placed:",
        options: ["In the recovery position — on its side with head extended", "On its back with all four legs up", "In a sitting position propped against a wall", "Upside down to improve blood flow"],
        answer: "In the recovery position — on its side with head extended",
      },
      {
        question: "If a pet is unconscious and not breathing, you should start CPR and:",
        options: ["Call a vet immediately while continuing", "Wait to see if it starts breathing on its own after 10 minutes", "Stop CPR and transport the pet only", "Give it liquid through its mouth"],
        answer: "Call a vet immediately while continuing",
      },
      {
        question: "Common causes of unconsciousness in pets include:",
        options: ["Trauma, poisoning, severe heatstroke, or heart problems", "Boredom or deep sleep", "Overeating a single meal", "Brief exposure to mild cold"],
        answer: "Trauma, poisoning, severe heatstroke, or heart problems",
      },
      {
        question: "When transporting an unconscious pet to the vet, you should:",
        options: ["Keep it still on a flat surface and support the head and neck", "Allow it to be positioned however is most comfortable for you", "Carry it by the scruff of the neck", "Let it stay wherever it is until the vet arrives"],
        answer: "Keep it still on a flat surface and support the head and neck",
      },
    ],
  },
};

function getQuestionsForSelection(pet: string, category: string): Question[] {
  const petQuestions = questionBank[pet] ?? questionBank["Other"];
  const categoryQuestions =
    petQuestions?.[category] ??
    questionBank["Other"]?.[category] ??
    Object.values(petQuestions ?? {})[0] ??
    [];
  return [...categoryQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
}

const PET_TYPES = Object.keys(PET_EMOJI);
const CATEGORIES = Object.keys(CAT_EMOJI);

export default function QuizPage() {
  const [step, setStep] = useState<Step>("pet");
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [quiz, setQuiz] = useState<Quiz>({
    quizID: "QUIZ001",
    question: [],
    totalMark: 5,
    score: 0,
  });

  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  function handleSelectPet(pet: string) {
    setSelectedPet(pet);
    setSelectedCategory("");
    setStep("category");
  }

  function handleSelectCategory(cat: string) {
    setSelectedCategory(cat);
    const questions = getQuestionsForSelection(selectedPet, cat);
    setQuiz({
      quizID: `QUIZ-${selectedPet.toUpperCase().slice(0, 3)}-${cat.toUpperCase().slice(0, 3)}`,
      question: questions,
      totalMark: questions.length,
      score: 0,
    });
    setSelectedAnswers({});
    setSubmitted(false);
    setShowPopup(false);
    setStep("quiz");
  }

  function reset() {
    setStep("pet");
    setSelectedPet("");
    setSelectedCategory("");
    setSelectedAnswers({});
    setSubmitted(false);
    setShowPopup(false);
  }

  function retakeQuiz() {
    const questions = getQuestionsForSelection(selectedPet, selectedCategory);
    setQuiz({
      ...quiz,
      question: questions,
      totalMark: questions.length,
      score: 0,
    });
    setSelectedAnswers({});
    setSubmitted(false);
    setShowPopup(false);
  }

  function getScore() {
    let total = 0;
    quiz.question.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) total++;
    });
    return total;
  }

  function submitQuiz() {
    const finalScore = getScore();
    setQuiz({ ...quiz, score: finalScore });
    setSubmitted(true);
    setShowPopup(true);
  }

  function handleSelect(questionIndex: number, option: string) {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: option });
  }

  const passed = quiz.score >= Math.ceil(quiz.totalMark * 0.6);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", padding: "40px 20px" }}>

      {/* Score popup */}
      {submitted && showPopup && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ width: "90%", maxWidth: "420px", backgroundColor: "white", borderRadius: "18px", padding: "32px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>Quiz Completed</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "6px" }}>
              {PET_EMOJI[selectedPet] ?? "🐾"} {selectedPet} — {CAT_EMOJI[selectedCategory] ?? "🚨"} {selectedCategory}
            </p>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>Your score is</p>
            <p style={{ fontSize: "46px", fontWeight: "bold", color: passed ? "#16a34a" : "#dc2626", marginBottom: "12px" }}>
              {quiz.score} / {quiz.totalMark}
            </p>
            <p style={{ color: passed ? "#166534" : "#991b1b", fontWeight: "600", marginBottom: "24px" }}>
              {passed ? "Great job! You passed the quiz." : "Keep practising and review the first-aid guide again."}
            </p>
            <button onClick={() => setShowPopup(false)} style={{ width: "100%", backgroundColor: "#2563eb", color: "white", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
              View Answers
            </button>
            <button onClick={retakeQuiz} style={{ width: "100%", backgroundColor: "#16a34a", color: "white", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer", marginBottom: "12px" }}>
              Retake Quiz
            </button>
            <button onClick={reset} style={{ width: "100%", backgroundColor: "#f3f4f6", color: "#374151", padding: "14px", borderRadius: "12px", border: "none", fontWeight: "600", cursor: "pointer" }}>
              Try Another Category
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", backgroundColor: "white", borderRadius: "16px", padding: "40px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>

        {/* Header */}
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "10px", color: "#111827" }}>
          Pet First Aid Quiz
        </h1>

        {/* Breadcrumb */}
        {(selectedPet || selectedCategory) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280", marginBottom: "24px", flexWrap: "wrap" }}>
            <button onClick={reset} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0, fontWeight: "500" }}>All Pets</button>
            {selectedPet && (
              <>
                <span>›</span>
                <button
                  onClick={() => { setStep("category"); setSelectedCategory(""); setSubmitted(false); setShowPopup(false); }}
                  style={{ background: "none", border: "none", color: selectedCategory ? "#3b82f6" : "#111827", cursor: selectedCategory ? "pointer" : "default", padding: 0, fontWeight: "500" }}
                >
                  {PET_EMOJI[selectedPet] ?? "🐾"} {selectedPet}
                </button>
              </>
            )}
            {selectedCategory && (
              <>
                <span>›</span>
                <span style={{ color: "#111827", fontWeight: "500" }}>{CAT_EMOJI[selectedCategory] ?? "🚨"} {selectedCategory}</span>
              </>
            )}
          </div>
        )}

        {/* Step: Pet selection */}
        {step === "pet" && (
          <>
            <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "16px" }}>Select your pet to begin.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
              {PET_TYPES.map(pet => (
                <button key={pet} onClick={() => handleSelectPet(pet)}
                  style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "24px 16px", textAlign: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>{PET_EMOJI[pet]}</div>
                  <p style={{ fontWeight: "600", fontSize: "14px", color: "#111827", margin: 0 }}>{pet}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: Category selection */}
        {step === "category" && (
          <>
            <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "16px" }}>
              Choose an emergency category for <strong>{selectedPet}</strong>.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => handleSelectCategory(cat)}
                  style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "20px 16px", textAlign: "left", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                >
                  <p style={{ fontSize: "22px", marginBottom: "8px", margin: "0 0 8px" }}>{CAT_EMOJI[cat]}</p>
                  <p style={{ fontWeight: "600", fontSize: "14px", color: "#111827", margin: 0 }}>{cat}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: Quiz */}
        {step === "quiz" && (
          <>
            <p style={{ marginBottom: "8px", color: "#6b7280", fontSize: "16px" }}>Quiz ID: {quiz.quizID}</p>
            <p style={{ marginBottom: "30px", color: "#6b7280", fontSize: "16px" }}>
              Answer all {quiz.totalMark} questions to test your knowledge.
            </p>

            {quiz.question.map((q, index) => (
              <div key={index} style={{ marginBottom: "28px", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "18px", color: "#111827" }}>
                  {index + 1}. {q.question}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {q.options.map(option => {
                    const isSelected = selectedAnswers[index] === option;
                    const isCorrect = option === q.answer;
                    const isWrong = submitted && isSelected && !isCorrect;
                    return (
                      <label key={option} style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "10px",
                        border: submitted ? (isCorrect ? "2px solid #16a34a" : isWrong ? "2px solid #dc2626" : "1px solid #d1d5db") : "1px solid #d1d5db",
                        backgroundColor: submitted ? (isCorrect ? "#dcfce7" : isWrong ? "#fee2e2" : "white") : "white",
                        cursor: submitted ? "not-allowed" : "pointer",
                      }}>
                        <input type="radio" name={`question-${index}`} value={option} disabled={submitted} checked={isSelected} onChange={() => handleSelect(index, option)} />
                        <span>{option}</span>
                        {submitted && isCorrect && <span style={{ marginLeft: "auto", color: "#166534", fontWeight: "600" }}>Correct</span>}
                        {submitted && isWrong && <span style={{ marginLeft: "auto", color: "#991b1b", fontWeight: "600" }}>Your answer</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button onClick={submitQuiz} style={{ width: "100%", backgroundColor: "#2563eb", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "16px", cursor: "pointer" }}>
                Submit Quiz
              </button>
            ) : (
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={retakeQuiz} style={{ flex: 1, backgroundColor: "#16a34a", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "16px", cursor: "pointer" }}>
                  Retake Quiz
                </button>
                <button onClick={reset} style={{ flex: 1, backgroundColor: "#f3f4f6", color: "#374151", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "600", fontSize: "16px", cursor: "pointer" }}>
                  Try Another Category
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
