import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header/index';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
    banner: {
      url: string;
    };
    content: {
      heading: string;
      body: {
        type: string;
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  function timeToRead(content): string {
    const words = content
      .map(item => {
        return RichText.asText(item.body).split(' ');
      })
      .reduce((acc, curr) => [...curr, ...acc], [])
      .filter(i => i !== '');

    const min = Math.ceil(words.length / 200);

    return `${min} min`;
  }

  return (
    <>
      <Header />
      {router.isFallback ? (
        <div>Carregando...</div>
      ) : (
        <main className={styles.container}>
          <article className={styles.post}>
            <img src={post.data.banner.url} alt="banner" />
            <div>
              <h2>{post.data.title}</h2>
              <div className={commonStyles.publicationInfo}>
                <time>
                  <FiCalendar />

                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
                <time>
                  <FiClock />
                  {timeToRead(post.data.content)}
                </time>
              </div>
              {post.data.content.map(content => {
                return (
                  <div key={content.heading}>
                    <h3>{content.heading}</h3>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: Array.isArray(content.body)
                          ? RichText.asHtml(content.body)
                          : content.body,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </article>
        </main>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts'],
      pageSize: 2,
    }
  );
  const response = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });
  return {
    paths: response,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: Array.isArray(response.data.title)
        ? RichText.asText(response.data.title)
        : response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: response.data.banner,
      content: response.data.content.map(i => {
        return {
          heading: i.heading,
          body: i.body,
        };
      }),
    },
  };
  return {
    props: { post },
  };
};
