export function GoogleAnalytics() {
    return (
          <>
                <script 
                          async 
                          src={`https://www.googletagmanager.com/gtag/js?id=G-VXRMWZ471Q`}
                        />
                <script
                          dangerouslySetInnerHTML={{
                                      __html: `
                                                  window.dataLayer = window.dataLayer || [];
                                                              function gtag(){dataLayer.push(arguments);}
                                                                          gtag('js', new Date());
                                                                                      gtag('config', 'G-VXRMWZ471Q', {
                                                                                                    page_path: window.location.pathname,
                                                                                                                });
                                                                                                                          `,
                          }}
                        />
          </>>
        );
}</>
