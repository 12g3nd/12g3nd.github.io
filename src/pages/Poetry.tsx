import { useState } from 'react';
import PageTransition from '../components/PageTransition';
import Reveal from '../components/Reveal';
import ScrambleText from '../components/ScrambleText';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './Poetry.css';

export default function Poetry() {
  const [compactMode, setCompactMode] = useState(false);

  useDocumentMeta(
    'Poetry // Srihith Jarabana',
    'A selection of poems Srihith Jarabana has written, including award-winning work.'
  );

  return (
    <PageTransition>
      <section className="section">
        <div className="section-header">
          <h2><ScrambleText text="POETRY_" /></h2>
          <p style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', color: 'rgba(253,246,227,0.7)', fontSize: '14px' }}>
            some of my favourite poems I've ever written at various points in my life (in a fake PDF format of course)
          </p>
          <button
            className="poetry-compact-toggle"
            onClick={() => setCompactMode(prev => !prev)}
          >
            {compactMode ? '[NORMAL TEXT ↩]' : '[FIT TEXT →]'}
          </button>
        </div>
        <div style={{ marginTop: '3rem', maxWidth: '100%' }}>
          {(() => {
            const poems = [
            {
              date: '2023-10-13',
              title: 'A Ghazal for Gaza',
              award: '2024 Scholastic Arts & Writing Awards - International Silver Medal',
              wide: true,
              content: (
                <>
                  If you run, I'll run too. If you run to the truck, know I'll always follow. We have mere days.<br />
                  So, khaalah₁, tell me, does this mean we are going to see our home's devastating fall days?<br />
                  <br />
                  Why would they attack tonight? Why today? What about your family?<br />
                  Your baby, your husband—don't you want to see your daughter's funny crawl days.<br />
                  <br />
                  I'm sorry, I'll pray. For them. For us, too. That'll help. That'll save us from danger. <em>Right?</em><br />
                  I plead. Where even are they, khaalah? Without them, these are going to be some small days.<br />
                  <br />
                  Blood. Persian red. Our elderly neighbor, he needs help, he's on the floor. And he needs it fast.<br />
                  <em>We can't risk it, not now,</em> I think. No, we must, it's time to briefly relive our golden shawl days.<br />
                  <br />
                  It's already hard enough for my khaalah to get the driver ready and get some water, I joke<br />
                  That now I'm going to have tinnitus; I'm really not looking forward to my bald days.<br />
                  <br />
                  Humour, it sustains me. But it fails me, too. And like chicken tenders, bodies color the dirt<br />
                  Road and I already know, for the next few weeks, we'll live a lot of short nights and tall days.<br />
                  <br />
                  Oh khaalah, I'm sorry, I'll test you like an annoying elementary school teacher<br />
                  Who always has more to rant about, type of person to never end calls. Days.<br />
                  <br />
                  Teachers are older and far wiser than me—like you, they remember a Palestine of natural<br />
                  Thinkers and brave warriors who stood side by side before these deadly salt days.<br />
                  <br />
                  The people who want to kill me are not my enemies, I'm told. As crazy as that sounds.<br />
                  I shouldn't hate them. In fact, I'm related to some of them. I just wish to relive the doll days.<br />
                  <br />
                  I want a doll house full of doll things where we all live in perfect—ideal conditions. But it's a<br />
                  A doll house burnt sickly like a flare past its expiry. Let's get into this truck that hauls days.<br />
                  <br />
                  Losers, lovers, and the lost, they all flock to shelter, which will be gone soon. Maybe<br />
                  They replace Hamas, maybe we are in the history books' "new government they installed" days.<br />
                  <br />
                  They'll retaliate heavily, they'll test new weapons, I don't want to begin to imagine. The<br />
                  Girl in the back with us, I can tell she likes the fire. She is still in her innocent enthralled days.<br />
                  <br />
                  I hear gunshots. It blinds me. It was nearby, that's all I could tell. <em>Lina</em> they scream. My khaalah.<br />
                  She is sleeping. I shake her. She does not wake up. I cry; she knows I can't forever stall days.<br />
                  <br />
                  <br />
                  ¹"Auntie" in Arabic
                </>
              )
            },
            {
              date: '2024-12-20',
              title: 'Strawberry',
              award: undefined,
              content: (
                <>
                  You got God and I got you<br />
                  Achene gems, I could never choose<br />
                  Hammer it down, words I might've misconstrued<br />
                  How could I be a detective if I couldn't find the clues?<br />
                  <br />
                  So please, plant seeds of doubt in the garden of my mind<br />
                  Break another promise, like a contract unsigned<br />
                  Pluck my eyes like a calyx, make me blind<br />
                  Bring a shovel and bury me alive<br />
                  <br />
                  Like a zombie, eat my brain<br />
                  More or less, we're still the same<br />
                  Undefined, intertwined, I'm only here to remind<br />
                  Rhyming incessantly, I will never be able to ever decide<br />
                  <br />
                  Chew, spit, suck my flesh, absorb me into your belly<br />
                  You just liked the flavour, took time to be weary<br />
                  Read your taste buds in a plagued library<br />
                  Bleed me red like a strawberry
                </>
              )
            },
            {
              date: '2025-07-29',
              title: 'Perpetual State of Wanting to Sneeze',
              award: undefined,
              content: (
                <>
                  I left the window open by accident<br />
                  <br />
                  Sucked into a vortex of outer space<br />
                  I'm nowhere, somehow still out of place<br />
                  <br />
                  For I left the window open by accident<br />
                  <br />
                  And let the cold winds make me vulnerable<br />
                  Stuck in a purgatory of safe and insufferable<br />
                  <br />
                  When I left the window open by accident<br />
                  <br />
                  The illness gets to me and I can't let go<br />
                  Impaled and rotting, please leave me so<br />
                  <br />
                  Alas, I left the window open by accident again
                </>
              )
            },
            {
              date: '2026-01-02',
              title: 'Who Am I To Judge Another Sinner?',
              award: undefined,
              content: (
                <>
                  Hunger, danger<br />
                  Bloodshot eyes in the mirror<br />
                  But it's just a familiar stranger<br />
                  <br />
                  Ten years disappear<br />
                  Look at my perfect Canadian lawn<br />
                  I always thought we could've built a good life here<br />
                  <br />
                  Snap out of it quickly<br />
                  About to wrap the car around a pole<br />
                  Look to my side and there's no one there with me<br />
                  <br />
                  Lived life too fast<br />
                  Burnt out and accomplished nothing<br />
                  Dwell an eternity on the past<br />
                  <br />
                  Spent a life holding a grudge<br />
                  But it doesn't matter much now<br />
                  Since who am I to judge
                </>
              )
            },
            {
              date: '2023-05-11',
              title: 'A Spade of Leaves for Your Tears',
              award: 'LLCC 2nd Annual / 2023 Abbey Park Poetry Contest Winner',
              content: (
                <div style={{ textAlign: 'center' }}>
                  A<br />
                  <em>sad</em><br />
                  <strong>bud</strong> of<br />
                  a <em>new</em> life<br />
                  <strong>stalks</strong> me into<br />
                  <strong>lucid</strong> dreams and<br />
                  <em>your</em> blue <u>nightmares</u>.<br />
                  I see <strong>hope</strong> in the eyes of<br />
                  the <strong>rapt</strong> blue jays that pass by,<br />
                  <strong>even</strong> the black <u>bears</u>. My <em>gentle</em> ends<br />
                  <strong>bloom</strong> into fresh ideas, ones that help me<br />
                  become <u>aware</u>. Because what good is a world<br />
                  where I am <strong>constantly</strong> in a state of <u>despair</u>? I hope<br />
                  they don't <strong>forget</strong> me once I <u>leave</u>. The jealousy in me<br />
                  <strong>wants</strong> —————— them to —————— <u>grieve</u>.<br />
                  For an <strong>eternity</strong>, I convince myself to <u>believe</u>, But all my words are here<br />
                  to <strong>merely</strong> <u>deceive</u>. I hope that on this boring, but lush <em>Spring</em> <u>day</u>,<br />
                  I'll let <strong>go</strong> of the ————————— strings controlling me<br />
                  when I <u>pray</u> <strong>to</strong> the clouds that love me even when I go<br />
                  <u>astray</u>. It truly is a blessing to be the topic of a<br />
                  <strong>child's</strong> <u>ballet</u>. Still, it is a curse to <em>always</em><br />
                  feel this <u>high</u> <strong>since</strong> I am restricted<br />
                  to the <strong>floor</strong> of the <u>sky</u>, and<br />
                  I can't touch the <strong>stars</strong>,<br />
                  especially<br />
                  in <u>July</u>.<br />
                  A lonely<br />
                  <strong>hunt</strong> for<br />
                  the <strong>allure</strong><br />
                  of <em>liberty</em>,<br />
                  but I am<br />
                  <strong>stuck</strong><br />
                  <em>forever</em><br />
                  greeting<br />
                  the other<br />
                  leaves that<br />
                  <strong>pass</strong> <u>by</u>.
                </div>
              )
            },
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div className="doc-viewer">
                <div className="doc-viewer__chrome">
                  <span className="doc-viewer__filename">POETRY.pdf</span>
                  <span className="doc-viewer__meta">{poems.length} page{poems.length === 1 ? '' : 's'} · serif</span>
                </div>
                <div className="doc-viewer__pages">
                  {poems.map((poem, i) => (
                    <Reveal key={i} delay={Math.min(i, 3) * 0.06}>
                    <article className={`doc-page${('wide' in poem && poem.wide) ? ' doc-page--wide' : ''}`}>
                      <span className="doc-page__date">{poem.date}</span>
                      <h3 className="doc-page__title">{poem.title}</h3>
                      {poem.award && (
                        <div className="doc-page__award">{poem.award}</div>
                      )}
                      <hr className="doc-page__rule" />
                      <div className={`doc-page__body${compactMode ? ' doc-page__body--compact' : ''}`}>
                        {poem.content}
                      </div>
                      <div className="doc-page__footer">— {i + 1} / {poems.length} —</div>
                    </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </PageTransition>
  );
}
