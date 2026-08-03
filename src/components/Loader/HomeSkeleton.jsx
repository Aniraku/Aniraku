import React from "react"
import { L } from "./loader.style"
import NavBar from "../NavBar/NavBar"

function HomeSkeleton() {
  return (
    <>
      <NavBar />
      <L.Hero>
        <L.Skeleton>
          <L.Rank />
        </L.Skeleton>
        <L.Skeleton>
          <L.Title />
        </L.Skeleton>
        <L.Group>
          <L.Skeleton>
            <L.Desc />
          </L.Skeleton>
          <L.Skeleton>
            <L.Desc />
          </L.Skeleton>
          <L.Skeleton>
            <L.DescShort />
          </L.Skeleton>
          <L.Skeleton>
            <L.CTA />
          </L.Skeleton>
        </L.Group>
      </L.Hero>
      <L.Skeleton style={{ margin: "2em 2em 0" }}>
        <L.SectionTitle />
      </L.Skeleton>
      <L.Wrapper>
        {Array.from({ length: 6 }).map((_, i) => (
          <L.Card key={i} />
        ))}
      </L.Wrapper>
    </>
  )
}

export default HomeSkeleton
