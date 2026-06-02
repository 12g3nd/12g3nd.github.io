import { useParams } from 'react-router-dom';
import type { FC } from 'react';
import type { MDXProps, MDXComponents } from 'mdx/types';

import PageTransition from '../components/PageTransition';
import PostLayout from '../components/PostLayout';
import ScrambleText from '../components/ScrambleText';
import NotFound from './NotFound';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { posts } from '../data/posts';
import './BlogPost.css';

// Every post body in src/content is picked up automatically — no per-post route
// or import. Add an .mdx file + a record in posts.ts and the post exists.
const bodies = import.meta.glob<{ default: FC<MDXProps> }>('../content/*.mdx', {
  eager: true,
});
const POST_BODIES: Record<string, FC<MDXProps>> = {};
for (const [path, mod] of Object.entries(bodies)) {
  const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
  POST_BODIES[slug] = mod.default;
}

// Posts oldest-first, so a post's chronological position is its TRANSMISSION_NN.
const chronological = [...posts].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);

// Markdown links open in a new tab when external — mirrors the original posts,
// so authors just write [text](url) and never repeat target/rel by hand.
const mdxComponents: MDXComponents = {
  a: ({ href, children, ...rest }) => {
    const external = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
};

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = posts.find((p) => p.slug === slug);
  const Body = POST_BODIES[slug];

  // Called unconditionally (rules of hooks); falls back for the missing case.
  useDocumentMeta(
    post ? `${post.title} // Srihith Jarabana` : 'Not Found // Srihith Jarabana',
    post?.abstract
  );

  if (!post || !Body) return <NotFound />;

  const number = chronological.findIndex((p) => p.slug === slug) + 1;
  const transmission = `TRANSMISSION_${String(number).padStart(2, '0')}`;

  return (
    <PageTransition>
      <section className="section" style={{ paddingBottom: '5rem' }}>
        <div className="section-header" style={{ marginBottom: '3rem' }}>
          <h2><ScrambleText text={transmission} /></h2>
          <p className="post-log-date">{post.date} // LOG</p>
        </div>

        <PostLayout slug={post.slug} date={post.date}>
          <h1 className="post-title-main">{post.title}</h1>
          <div className="post-prose">
            <Body components={mdxComponents} />
          </div>
        </PostLayout>
      </section>
    </PageTransition>
  );
}
