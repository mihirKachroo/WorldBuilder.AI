#!/usr/bin/env python3
"""
Seed the database with test characters and relationships for the test user.
This adds the original hardcoded characters from the dashboard.
"""

from app import app, db
from models import User, Project, Character, CharacterRelationship

def seed_test_data():
    """Add test characters and relationships to the test user's project"""
    with app.app_context():
        # Find test user
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            print("❌ Test user not found. Please run create_test_user.py first.")
            return

        # Find or create the Eldoria project
        project = Project.query.filter_by(user_id=test_user.id, name='Eldoria').first()
        if not project:
            project = Project(user_id=test_user.id, name='Eldoria', description='Sample world project')
            db.session.add(project)
            db.session.commit()
            print(f"✓ Created project 'Eldoria'")

        # Clear existing characters and relationships for this project
        existing_chars = Character.query.filter_by(project_id=project.id).all()
        if existing_chars:
            print(f"⚠️  Found {len(existing_chars)} existing characters. Clearing them...")
            # Delete relationships first (cascade should handle this, but being explicit)
            for char in existing_chars:
                CharacterRelationship.query.filter_by(source_character_id=char.id).delete()
                CharacterRelationship.query.filter_by(target_character_id=char.id).delete()
            # Delete characters
            for char in existing_chars:
                db.session.delete(char)
            db.session.commit()
            print("✓ Cleared existing characters and relationships")

        # Define characters
        characters_data = [
            {
                'name': 'King Arion',
                'description': 'Former monarch, died 10 years before the Siege of Eldor.',
                'position': {'x': 200, 'y': 100},
                'colors': {
                    'bg': 'bg-blue-100',
                    'border': 'border-blue-200',
                    'text': 'text-gray-dark',
                    'icon': 'text-blue-600'
                }
            },
            {
                'name': 'Queen Selara',
                'description': """Queen Selara hails from the mist-shrouded Eastern Isles, where she once served as a gifted healer before her marriage to King Eldor bound two distant realms. Though foreign to Eldoria's courtly intrigues, Selara's calm presence and compassion quickly earned her the loyalty of the common folk and the cautious respect of the nobility.

During the Siege of Eldor, she tended to the wounded herself, transforming the palace halls into makeshift infirmaries. Many still whisper that her healing saved the king's life after the final assault. Yet behind her serene demeanor lies quiet political acumen—Selara often mediates between Eldor's hard-edged advisors, especially Mira Valen and Captain Aris Vorn, whose rivalry threatens the fragile peace of the court.

Selara's devotion to her children, Prince Kael and Princess Lyra, anchors her amidst the turbulence of rule. To Eldoria's people, she represents the heart that softens the crown—a queen whose mercy tempers the steel of her husband's reign.""",
                'position': {'x': 250, 'y': 50},
                'colors': {
                    'bg': 'bg-blue-100',
                    'border': 'border-blue-200',
                    'text': 'text-gray-dark',
                    'icon': 'text-blue-600'
                }
            },
            {
                'name': 'King Eldor',
                'description': """King Eldor is the reigning monarch of Eldoria, a ruler forged in the aftermath of his father's death and the chaos that followed. Ten years after King Arion's passing, Eldor ascended the throne amid political unrest and the looming threat of rebellion. His leadership during the Siege of Eldor defined a new era—marked by both unity and unease.

Once a disciplined commander under his father's reign, Eldor rose to power through sheer resolve. With his queen, Selara, he strives to stabilize a kingdom scarred by war, though his rule often balances on a knife's edge between diplomacy and domination.

Eldor is advised by Mira Valen, whose sharp counsel and past in the Order of the Flame lend him strategic insight. He entrusts the protection of the crown to Captain Aris Vorn, yet whispers in the court suggest growing tensions between Aris's loyalty and Mira's influence.

Despite his power, Eldor remains haunted by his father's shadow and the legacy of King Arion, whose ideals of faith and honor often clash with Eldor's pragmatic rule. His rivalry with Lord Kaen Darros threatens to ignite civil unrest, while his strained alliance with Grandmaster Thalos of the Order hints at deeper ideological divides.

To his people, Eldor is both savior and symbol—a king who rebuilt what was broken but may yet sow the seeds of a new conflict.""",
                'position': {'x': 400, 'y': 150},
                'colors': {
                    'bg': 'bg-pink-100',
                    'border': 'border-primary',
                    'text': 'text-gray-dark',
                    'icon': 'text-primary'
                }
            },
            {
                'name': 'Prince Kael',
                'description': """Prince Kael, heir to the throne of Eldoria, stands at the crossroads between legacy and change. Born during the final years of the Siege of Eldor, he grew up amidst reconstruction and the quiet disillusionment of a kingdom rebuilding from ash. Unlike his father, King Eldor, Kael believes peace cannot be forged solely through strength. He dreams of a gentler Eldoria—one guided by diplomacy, education, and trust in its people.

Despite his noble ideals, Kael's defiance often puts him at odds with his father's hardened rule. His mother, Queen Selara, remains his closest confidant, encouraging his compassion even as the court whispers that his youth blinds him to the realities of power. Torn between admiration and resentment, Kael struggles to live up to a legacy that glorifies war while his heart seeks peace.

His bond with Princess Lyra keeps him grounded, though his friendship with Sister Nira of the Order of the Flame has begun to draw suspicion—especially from Captain Aris Vorn, who sees danger in the prince's sympathies toward the old faith.

To the realm, Kael is the promise of renewal; to his father, he is a reminder that the next age may not be his own.""",
                'position': {'x': 500, 'y': 250},
                'colors': {
                    'bg': 'bg-blue-100',
                    'border': 'border-blue-200',
                    'text': 'text-gray-dark',
                    'icon': 'text-blue-600'
                }
            },
            {
                'name': 'Captain Aris Vorn',
                'description': """Captain Aris Vorn commands the Royal Guard of Eldoria, a soldier whose loyalty to King Eldor was forged in the blood and fire of the Siege of Eldor. Once a battlefield companion of Mira Valen, Aris now embodies the rigid discipline and honor of the old guard—unquestioning service to crown and country.

Though respected for his valor, Aris often clashes with Mira's strategic pragmatism and Queen Selara's diplomacy. He believes strength—not negotiation—is the surest path to stability. His devotion to Eldor borders on absolute, yet beneath the iron exterior lies a man weary of endless war, quietly haunted by the memory of fallen comrades and the shadow of King Arion, whose ideals he still holds sacred.

Aris represents the soldier's burden in Eldoria's new age: steadfast, scarred, and struggling to serve a peace he no longer fully understands.""",
                'position': {'x': 600, 'y': 100},
                'colors': {
                    'bg': 'bg-purple-100',
                    'border': 'border-purple-200',
                    'text': 'text-gray-dark',
                    'icon': 'text-purple-600'
                }
            },
            {
                'name': 'High Seer Elenwen',
                'description': 'Court prophet; Interprets omens; rumored to have opposed the war privately.',
                'position': {'x': 600, 'y': 250},
                'colors': {
                    'bg': 'bg-purple-100',
                    'border': 'border-purple-200',
                    'text': 'text-gray-dark',
                    'icon': 'text-purple-600'
                }
            },
            {
                'name': 'Mira Valen',
                'description': """Once a rising knight within the Order of the Flame, Mira Valen walked away from the Order after witnessing its corruption during the Siege of Eldor. Her tactical brilliance and unwavering sense of purpose caught the attention of King Eldor, who named her his royal strategist and closest counselor.

Though admired for her intellect, Mira's past ties to the Order make her a figure of quiet controversy within the palace. Many question where her loyalty truly lies—between the crown she now serves or the faith she once abandoned. Her friendship with Queen Selara lends her warmth among the royal circle, but her rivalry with Captain Aris Vorn simmers beneath the surface, each challenging the other's vision of how Eldoria should be defended.

To Eldor, she is both weapon and conscience: the one who helps him win wars, and the one who reminds him why he fights them.""",
                'position': {'x': 600, 'y': 350},
                'colors': {
                    'bg': 'bg-purple-100',
                    'border': 'border-purple-200',
                    'text': 'text-gray-dark',
                    'icon': 'text-purple-600'
                }
            },
        ]

        # Create characters
        created_chars = {}
        for char_data in characters_data:
            char = Character(
                project_id=project.id,
                name=char_data['name'],
                description=char_data['description'],
                position_x=char_data['position']['x'],
                position_y=char_data['position']['y'],
                bg_color=char_data['colors']['bg'],
                border_color=char_data['colors']['border'],
                text_color=char_data['colors']['text'],
                icon_color=char_data['colors']['icon']
            )
            db.session.add(char)
            db.session.flush()  # Get the ID
            created_chars[char_data['name']] = char.id
            print(f"✓ Created character: {char_data['name']}")

        db.session.commit()

        # Define relationships
        relationships_data = [
            {
                'source': 'King Eldor',
                'target': 'King Arion',
                'label': 'son of'
            },
            {
                'source': 'King Eldor',
                'target': 'Queen Selara',
                'label': 'husband of'
            },
            {
                'source': 'King Eldor',
                'target': 'Prince Kael',
                'label': 'father of'
            },
            {
                'source': 'King Eldor',
                'target': 'Captain Aris Vorn',
                'label': 'commands'
            },
            {
                'source': 'King Eldor',
                'target': 'High Seer Elenwen',
                'label': 'consults'
            },
            {
                'source': 'King Eldor',
                'target': 'Mira Valen',
                'label': 'advised by'
            },
        ]

        # Create relationships
        for rel_data in relationships_data:
            source_id = created_chars.get(rel_data['source'])
            target_id = created_chars.get(rel_data['target'])
            
            if source_id and target_id:
                rel = CharacterRelationship(
                    project_id=project.id,
                    source_character_id=source_id,
                    target_character_id=target_id,
                    label=rel_data['label']
                )
                db.session.add(rel)
                print(f"✓ Created relationship: {rel_data['source']} → {rel_data['label']} → {rel_data['target']}")

        db.session.commit()
        print("\n✅ Test data seeded successfully!")
        print(f"   Project: {project.name}")
        print(f"   Characters: {len(created_chars)}")
        print(f"   Relationships: {len(relationships_data)}")

if __name__ == '__main__':
    seed_test_data()

