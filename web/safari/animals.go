package safari

import "strings"

// lore matches part of an animal's name to its emoji and a fun fact. The
// first match wins, so the more specific names come first.
var lore = []struct {
	match, emoji, fact string
}{
	{"whale shark", "🦈", "The biggest fish alive, a whale shark can reach 18 metres and eats mostly plankton."},
	{"wild dog", "🐕", "Painted wolves hunt in packs, and each one's coat pattern is unique."},
	{"hyaena", "🐾", "Spotted hyaenas live in clans run by females, and their 'laugh' can carry for kilometres."},
	{"hyena", "🐾", "Spotted hyenas live in clans run by females, and their 'laugh' can carry for kilometres."},
	{"black rhinoceros", "🦏", "Black rhinos are browsers with a hooked upper lip, made for plucking leaves."},
	{"rhinoceros", "🦏", "White rhinos are grazers: 'white' may come from the Afrikaans 'wyd', meaning wide-mouthed."},
	{"lion", "🦁", "A lion's roar can be heard up to 8 kilometres away across the savanna."},
	{"leopard", "🐆", "Leopards haul prey heavier than themselves up into trees to keep it from lions."},
	{"cheetah", "🐆", "The fastest land animal: 0 to 100 km/h in about three seconds."},
	{"elephant", "🐘", "Elephants can hear each other's rumbles through the ground, kilometres apart."},
	{"giraffe", "🦒", "A giraffe's tongue is about 50 cm long and dark, possibly to stop it getting sunburnt."},
	{"zebra", "🦓", "No two zebras have the same stripes, and foals learn their mother's pattern."},
	{"hippopotamus", "🦛", "Hippos secrete a red oily 'blood sweat' that works as sunscreen."},
	{"buffalo", "🐃", "African buffalo herds 'vote' on which way to go by facing the direction they prefer."},
	{"wildebeest", "🦬", "Over a million wildebeest loop through the Serengeti and Mara every year."},
	{"impala", "🦌", "Impalas can leap 3 metres high and 10 metres long to confuse predators."},
	{"warthog", "🐗", "Warthogs kneel to graze and reverse into burrows so their tusks face out."},
	{"crocodile", "🐊", "Nile crocodiles can go months between meals and live for over 70 years."},
	{"penguin", "🐧", "African penguins bray like donkeys, and their pink eye patches help them keep cool."},
	{"dolphin", "🐬", "Spinner dolphins can spin up to seven times in a single leap."},
	{"whale", "🐋", "Sperm whales have the largest brain of any animal on Earth."},
	{"chimpanzee", "🐒", "Chimpanzees use tools: sticks for termites and stones to crack nuts."},
	{"gorilla", "🦍", "Mountain gorillas share about 98% of their DNA with us."},
	{"lemur", "🐒", "Ring-tailed lemurs hold 'stink fights', wafting scent from their tails at rivals."},
	{"flamingo", "🦩", "Flamingos are pink from the algae and shrimp they eat; chicks hatch grey."},
	{"shoebill", "🪶", "The shoebill stands still for hours, then strikes with a bill like a wooden clog."},
	{"leatherback", "🐢", "Leatherbacks dive deeper than 1,000 metres and cross whole oceans to nest."},
	{"turtle", "🐢", "Sea turtles return to the beach where they hatched to lay their own eggs."},
	{"shark", "🦈", "Sharks have been around longer than trees, over 400 million years."},
}

// Emoji returns the emoji for an animal, or paw prints.
func Emoji(name string) string {
	if l, ok := loreFor(name); ok {
		return l.emoji
	}
	return "🐾"
}

// Fact returns a short fun fact for an animal, or a general one.
func Fact(name string) string {
	if l, ok := loreFor(name); ok {
		return l.fact
	}
	return "Every sighting here was recorded by someone in the field and shared openly on GBIF."
}

func loreFor(name string) (struct{ match, emoji, fact string }, bool) {
	lower := strings.ToLower(name)
	for _, l := range lore {
		if strings.Contains(lower, l.match) {
			return l, true
		}
	}
	return struct{ match, emoji, fact string }{}, false
}
