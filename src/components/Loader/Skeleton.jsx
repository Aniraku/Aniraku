import React from "react"
import NavBar from "../NavBar/NavBar"
import { L } from "./loader.style"

function Skeleton() {
  return (
    <>
      <NavBar />
      <L.Wrapper>
        <L.Skeleton>
          <L.Card />
        </L.Skeleton>
        <L.Skeleton>
          <L.Card />
        </L.Skeleton>
        <L.Skeleton>
          <L.Card />
        </L.Skeleton>
        <L.Skeleton>
          <L.Card />
        </L.Skeleton>
        <L.Skeleton>
          <L.Card />
        </L.Skeleton>
        <L.Skeleton>
          <L.Card />
        </L.Skeleton>
      </L.Wrapper>
    </>
  )
}

export default Skeleton
